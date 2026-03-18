"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import {
  db,
  medicines,
  organizations,
  purchaseItems,
  purchases,
  supplierMedicines,
  stockMovements,
  suppliers,
  stockItems,
  medicineBatches
} from "@workspace/database"
import { and, desc, eq, ilike, sql } from "drizzle-orm"
import { z } from "zod"
import { getErrorMessage } from "@/lib/utils/error"

const purchaseSchema = z.object({
  medicineId: z.string().uuid({ message: "Obat tidak valid" }),
  supplierId: z.string().uuid({ message: "Supplier tidak valid" }),
  warehouseId: z.string().uuid({ message: "Gudang tidak valid" }),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  supplierSku: z.string().optional(),
  quantity: z.coerce.number().positive({ message: "Jumlah harus lebih dari 0" }),
  priceAtTransaction: z.coerce.number().nonnegative({ message: "Harga tidak valid" }).optional(),
  note: z.string().optional(),
})

function nextPurchaseNumber(lastNumber: string | null | undefined, yyyymm: string) {
  const prefix = `PO-${yyyymm}-`
  const current = lastNumber?.startsWith(prefix) ? Number(lastNumber.slice(prefix.length)) : 0
  return `${prefix}${String(current + 1).padStart(4, "0")}`
}

function nextInvoiceNumber(lastNumber: string | null | undefined, yyyymm: string) {
  const prefix = `INV-${yyyymm}-`
  const current = lastNumber?.startsWith(prefix) ? Number(lastNumber.slice(prefix.length)) : 0
  return `${prefix}${String(current + 1).padStart(4, "0")}`
}

export async function createPurchaseAction(_prevState: unknown, formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  const userId = session?.user?.id

  if (!organizationId || !userId) {
    return { message: "Unauthorized" }
  }

  const validatedFields = purchaseSchema.safeParse(Object.fromEntries(formData.entries()))

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal memproses pembelian. Mohon periksa input Anda.",
    }
  }

  const { 
    medicineId, 
    supplierId, 
    warehouseId,
    batchNumber,
    expiryDate,
    supplierSku, 
    quantity, 
    priceAtTransaction, 
    note 
  } = validatedFields.data

  try {
    await db.transaction(async (tx) => {
      await tx
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .for("update")

      const [medicine] = await tx
        .select()
        .from(medicines)
        .where(and(eq(medicines.id, medicineId), eq(medicines.organizationId, organizationId)))
        .for("update")

      if (!medicine) {
        throw new Error("Obat tidak ditemukan")
      }

      const [supplier] = await tx
        .select({
          id: suppliers.id,
          leadTimeDays: suppliers.leadTimeDays,
        })
        .from(suppliers)
        .where(and(eq(suppliers.id, supplierId), eq(suppliers.organizationId, organizationId)))

      if (!supplier) {
        throw new Error("Supplier tidak ditemukan")
      }

      const now = new Date()
      const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`

      const [lastPurchase] = await tx
        .select({ purchaseNumber: purchases.purchaseNumber, invoiceNumber: purchases.invoiceNumber })
        .from(purchases)
        .where(
          and(
            eq(purchases.organizationId, organizationId),
            ilike(purchases.purchaseNumber, `PO-${yyyymm}-%`),
            ilike(purchases.invoiceNumber, `INV-${yyyymm}-%`)
          )
        )
        .orderBy(desc(purchases.purchaseNumber), desc(purchases.invoiceNumber))
        .limit(1)

      const purchaseNumber = nextPurchaseNumber(lastPurchase?.purchaseNumber, yyyymm)
      const invoiceNumber = nextInvoiceNumber(lastPurchase?.invoiceNumber, yyyymm)

      const unitPrice = priceAtTransaction ?? Number(medicine.purchasePrice)
      const normalizedSupplierSku = supplierSku?.trim() || null
      const totalAmount = unitPrice * quantity

      // 1. Resolve Batch ID
      let finalBatchId = null
      if (batchNumber) {
        const [existingBatch] = await tx
          .select()
          .from(medicineBatches)
          .where(and(
            eq(medicineBatches.medicineId, medicineId),
            eq(medicineBatches.batchNumber, batchNumber),
            eq(medicineBatches.organizationId, organizationId)
          ))
        
        if (existingBatch) {
          finalBatchId = existingBatch.id
        } else if (expiryDate) {
          const [newBatch] = await tx
            .insert(medicineBatches)
            .values({
              organizationId,
              medicineId,
              batchNumber,
              expiryDate: new Date(expiryDate),
            })
            .returning({ id: medicineBatches.id })
          
          if (newBatch) {
            finalBatchId = newBatch.id
          }
        }
      }

      // 2. Update/Insert Stock Item
      const [stockItem] = await tx
        .select()
        .from(stockItems)
        .where(and(
          eq(stockItems.medicineId, medicineId),
          eq(stockItems.warehouseId, warehouseId),
          finalBatchId ? eq(stockItems.batchId, finalBatchId) : sql`${stockItems.batchId} IS NULL`,
          eq(stockItems.organizationId, organizationId)
        ))
        .for("update")

      const currentItemQty = Number(stockItem?.quantity ?? 0)
      const newItemQty = currentItemQty + quantity

      if (stockItem) {
        await tx
          .update(stockItems)
          .set({ quantity: newItemQty.toString(), updatedAt: new Date() })
          .where(eq(stockItems.id, stockItem.id))
      } else {
        await tx
          .insert(stockItems)
          .values({
            organizationId,
            warehouseId,
            medicineId,
            batchId: finalBatchId,
            quantity: newItemQty.toString(),
          })
      }

      // 3. Update legacy total stock cache in medicines
      const [totalStockResult] = await tx
        .select({ total: sql<string>`sum(${stockItems.quantity})` })
        .from(stockItems)
        .where(and(
          eq(stockItems.medicineId, medicineId),
          eq(stockItems.organizationId, organizationId)
        ))
      
      const totalStock = totalStockResult?.total ?? "0"

      await tx
        .update(medicines)
        .set({ stock: totalStock, updatedAt: new Date() })
        .where(eq(medicines.id, medicineId))

      // 4. Record Purchase
      const [purchase] = await tx
        .insert(purchases)
        .values({
          organizationId,
          supplierId,
          userId,
          purchaseNumber,
          invoiceNumber,
          totalAmount: totalAmount.toFixed(2),
          note,
        })
        .returning({ id: purchases.id })

      if (!purchase) {
        throw new Error("Gagal membuat pembelian")
      }

      await tx.insert(purchaseItems).values({
        purchaseId: purchase.id,
        medicineId,
        quantity: quantity.toString(),
        unitPrice: unitPrice.toFixed(2),
        totalPrice: totalAmount.toFixed(2),
      })

      // 5. Record movement
      await tx.insert(stockMovements).values({
        organizationId,
        medicineId,
        warehouseId,
        batchId: finalBatchId,
        userId,
        purchaseId: purchase.id,
        supplierId,
        type: "in",
        quantity: quantity.toString(),
        priceAtTransaction: unitPrice.toFixed(2),
        resultingStock: totalStock,
        reference: purchaseNumber,
        note: note || `Pembelian (${invoiceNumber})`,
      })

      // 6. Keep supplier-medicine mapping hot
      await tx
        .update(supplierMedicines)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(
          and(
            eq(supplierMedicines.organizationId, organizationId),
            eq(supplierMedicines.medicineId, medicineId)
          )
        )

      await tx
        .insert(supplierMedicines)
        .values({
          organizationId,
          supplierId,
          medicineId,
          supplierSku: normalizedSupplierSku,
          lastPurchasePrice: unitPrice.toFixed(2),
          leadTimeDays: Number(supplier.leadTimeDays),
          isPrimary: true,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: [
            supplierMedicines.organizationId,
            supplierMedicines.supplierId,
            supplierMedicines.medicineId,
          ],
          set: {
            ...(normalizedSupplierSku ? { supplierSku: normalizedSupplierSku } : {}),
            lastPurchasePrice: unitPrice.toFixed(2),
            leadTimeDays: Number(supplier.leadTimeDays),
            isPrimary: true,
            isActive: true,
            updatedAt: new Date(),
          },
        })
    })

    revalidatePath("/dashboard/medicines")
    revalidatePath("/dashboard/inventory")
    revalidatePath("/dashboard/inventory/stock")
    revalidatePath("/dashboard/procurement")
    revalidatePath("/dashboard/procurement/purchases")

    return {
      success: true,
      message: "Pembelian berhasil dicatat",
    }
  } catch (error: unknown) {
    console.error("PROCUREMENT_PURCHASE_ACTION_ERROR:", error)
    return { message: getErrorMessage(error) }
  }
}
