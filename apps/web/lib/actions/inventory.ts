"use server"

import { auth } from "@/auth"
import { db, medicines, stockMovements, users, warehouses, medicineBatches, stockItems, suppliers } from "@workspace/database"
import { eq, and, desc, ilike, or, sql, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getErrorMessage } from "@/lib/utils/error"

const stockMovementSchema = z.object({
  medicineId: z.string().uuid({ message: "Obat tidak valid" }),
  warehouseId: z.string().uuid({ message: "Gudang tidak valid" }),
  batchNumber: z.string().optional(), // Used for 'in'
  expiryDate: z.string().optional(),  // Used for new batch creation
  batchId: z.string().uuid().optional(), // Used for 'out' or 'adjustment'
  type: z.enum(["in", "out", "adjustment"], { message: "Tipe transaksi tidak valid" }),
  quantity: z.coerce.number().finite().nonnegative({ message: "Jumlah harus berupa angka positif" }),
  priceAtTransaction: z.string().optional().default("0"),
  reference: z.string().optional(),
  note: z.string().optional(),
})

export async function getStockMovementsAction(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  type: "in" | "out" | "adjustment"
) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("Unauthorized")
  }

  const offset = (page - 1) * limit

  // 1. Build where clause
  const baseCondition = and(
    eq(stockMovements.organizationId, organizationId),
    eq(stockMovements.type, type)
  )

  const searchCondition = search
    ? or(
        ilike(medicines.name, `%${search}%`),
        ilike(stockMovements.reference, `%${search}%`),
        ilike(stockMovements.note, `%${search}%`)
      )
    : undefined

  const finalCondition = searchCondition 
    ? and(baseCondition, searchCondition)
    : baseCondition

  // 2. Fetch data with joins
  const data = await db
    .select({
      id: stockMovements.id,
      type: stockMovements.type,
      quantity: stockMovements.quantity,
      balanceBefore: stockMovements.balanceBefore,
      resultingStock: stockMovements.resultingStock,
      reference: stockMovements.reference,
      note: stockMovements.note,
      createdAt: stockMovements.createdAt,
      medicine: {
        id: medicines.id,
        name: medicines.name,
        sku: medicines.sku,
        unit: medicines.unit,
        stock: medicines.stock,
      },
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      },
      warehouse: {
        id: warehouses.id,
        name: warehouses.name,
      },
      batch: {
        id: medicineBatches.id,
        batchNumber: medicineBatches.batchNumber,
        expiryDate: medicineBatches.expiryDate,
      },
      supplier: {
        id: suppliers.id,
        name: suppliers.name,
        code: suppliers.code,
      }
    })
    .from(stockMovements)
    .innerJoin(medicines, eq(stockMovements.medicineId, medicines.id))
    .innerJoin(users, eq(stockMovements.userId, users.id))
    .leftJoin(warehouses, eq(stockMovements.warehouseId, warehouses.id))
    .leftJoin(medicineBatches, eq(stockMovements.batchId, medicineBatches.id))
    .leftJoin(suppliers, eq(stockMovements.supplierId, suppliers.id))
    .where(finalCondition)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(stockMovements.createdAt))

  // 3. Get total count for pagination
  const [totalCount] = await db
    .select({ value: count() })
    .from(stockMovements)
    .innerJoin(medicines, eq(stockMovements.medicineId, medicines.id))
    .where(finalCondition)

  const total = Number(totalCount?.value ?? 0)
  const totalPages = Math.ceil(total / limit)

  return {
    data,
    metadata: {
      total,
      page,
      limit,
      totalPages,
    },
  }
}

export async function createStockMovementAction(prevState: any, formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  const userId = session?.user?.id

  if (!organizationId || !userId) {
    return { message: "Unauthorized" }
  }

  const validatedFields = stockMovementSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal memproses stok. Mohon periksa input Anda.",
    }
  }

  const { 
    medicineId, 
    warehouseId,
    batchNumber,
    expiryDate,
    batchId: providedBatchId,
    type, 
    quantity: inputQty, 
    priceAtTransaction, 
    reference, 
    note 
  } = validatedFields.data

  try {
    await db.transaction(async (tx) => {
      // 1. Resolve Batch ID
      let finalBatchId = providedBatchId || null

      if (type === "in" && batchNumber) {
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

      // 2. Fetch current stock item with locking
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

      const currentQty = Number(stockItem?.quantity ?? 0)
      let newQty = currentQty
      let deltaQty = 0

      if (type === "in") {
        deltaQty = inputQty
        newQty = currentQty + deltaQty
      } else if (type === "out") {
        if (currentQty < inputQty) {
          throw new Error(`Stok di gudang/batch ini tidak mencukupi. Sisa: ${currentQty}`)
        }
        deltaQty = -inputQty
        newQty = currentQty + deltaQty
      } else if (type === "adjustment") {
        newQty = inputQty
        deltaQty = newQty - currentQty
      }

      // 3. Update or Insert stock_items
      if (stockItem) {
        await tx
          .update(stockItems)
          .set({ quantity: newQty.toString(), updatedAt: new Date() })
          .where(eq(stockItems.id, stockItem.id))
      } else {
        await tx
          .insert(stockItems)
          .values({
            organizationId,
            warehouseId,
            medicineId,
            batchId: finalBatchId,
            quantity: newQty.toString(),
          })
      }

      // 4. Update Global Stock Cache in medicines table
      const [totalStockResult] = await tx
        .select({ total: sql<string>`sum(${stockItems.quantity})` })
        .from(stockItems)
        .where(and(
          eq(stockItems.medicineId, medicineId),
          eq(stockItems.organizationId, organizationId)
        ))
      
      const globalTotalStock = totalStockResult?.total ?? "0"

      await tx
        .update(medicines)
        .set({ stock: globalTotalStock, updatedAt: new Date() })
        .where(eq(medicines.id, medicineId))

      // 5. Record movement with LEDGER LOGIC (Before and After)
      await tx.insert(stockMovements).values({
        organizationId,
        medicineId,
        warehouseId,
        batchId: finalBatchId,
        userId,
        type,
        quantity: deltaQty.toString(),
        priceAtTransaction: priceAtTransaction || "0",
        balanceBefore: currentQty.toString(), // Saldo per gudang sebelum mutasi
        resultingStock: newQty.toString(),    // Saldo per gudang sesudah mutasi
        reference,
        note,
      })
    })

    revalidatePath("/dashboard/medicines")
    revalidatePath("/dashboard/inventory/stock")
    revalidatePath(`/dashboard/inventory/stock/${type}`)
    
    return { 
      message: "Transaksi stok berhasil dicatat", 
      success: true 
    }
  } catch (error: unknown) {
    console.error("INVENTORY_ACTION_ERROR:", error)
    return { message: getErrorMessage(error) }
  }
}
