"use server"

import { auth } from "@/auth"
import { db, medicines, sales, saleItems, stockMovements } from "@workspace/database"
import { eq, sql, desc, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getErrorMessage } from "@/lib/utils/error"

const saleItemSchema = z.object({
  medicineId: z.string().uuid("ID Obat tidak valid"),
  quantity: z.number().positive("Jumlah harus lebih dari 0"),
  priceAtSale: z.number().nonnegative("Harga tidak boleh negatif"),
})

const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "Keranjang tidak boleh kosong"),
  paymentMethod: z.string().min(1, "Metode pembayaran harus dipilih"),
  paidAmount: z.number().nonnegative("Jumlah bayar tidak boleh negatif"),
  customerName: z.string().optional(),
  note: z.string().optional(),
})

export type SaleInput = z.infer<typeof saleSchema>

export async function createSaleAction(data: SaleInput) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  const userId = session?.user?.id

  if (!organizationId || !userId) {
    return { error: "Unauthorized" }
  }

  const validatedFields = saleSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: "Input tidak valid",
      details: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { items, paymentMethod, paidAmount, customerName, note } = validatedFields.data

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Generate Invoice Number
      // Format: INV-YYYYMMDD-NNNN
      const today = new Date()
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")
      
      const lastSale = await tx.query.sales.findFirst({
        where: eq(sales.organizationId, organizationId),
        orderBy: [desc(sales.createdAt)],
      })

      let sequence = 1
      if (lastSale && lastSale.invoiceNumber.includes(dateStr)) {
        const lastSeq = parseInt(lastSale.invoiceNumber.split("-").pop() || "0")
        sequence = lastSeq + 1
      }
      
      const invoiceNumber = `INV-${dateStr}-${sequence.toString().padStart(4, "0")}`

      // 2. Calculate Totals
      let totalAmount = 0
      for (const item of items) {
        totalAmount += item.quantity * item.priceAtSale
      }

      const changeAmount = paidAmount - totalAmount

      if (changeAmount < 0) {
        throw new Error("Pembayaran kurang")
      }

      // 3. Create Sale Record
      const [sale] = await tx
        .insert(sales)
        .values({
          organizationId,
          userId,
          invoiceNumber,
          totalAmount: totalAmount.toString(),
          paidAmount: paidAmount.toString(),
          changeAmount: changeAmount.toString(),
          paymentMethod,
          customerName,
          note,
        })
        .returning()

      if (!sale) {
        throw new Error("Gagal menyimpan data penjualan")
      }

      // 4. Process Items (Update Stock, Create SaleItems, Create StockMovements)
      for (const item of items) {
        // Fetch medicine with row lock and org scope
        const [medicine] = await tx
          .select()
          .from(medicines)
          .where(and(
            eq(medicines.id, item.medicineId),
            eq(medicines.organizationId, organizationId)
          ))
          .for("update")

        if (!medicine) {
          throw new Error(`Obat tidak ditemukan atau akses ditolak: ${item.medicineId}`)
        }

        const currentStock = parseFloat(medicine.stock)
        const newStock = currentStock - item.quantity

        if (newStock < 0) {
          throw new Error(`Stok tidak cukup untuk ${medicine.name} (Sisa: ${currentStock})`)
        }

        // Update Medicine Stock
        await tx
          .update(medicines)
          .set({ stock: newStock.toString(), updatedAt: new Date() })
          .where(and(
            eq(medicines.id, item.medicineId),
            eq(medicines.organizationId, organizationId)
          ))

        // Create Sale Item
        await tx.insert(saleItems).values({
          saleId: sale.id,
          medicineId: item.medicineId,
          quantity: item.quantity.toString(),
          purchasePriceAtSale: medicine.purchasePrice,
          priceAtSale: item.priceAtSale.toString(),
          totalPrice: (item.quantity * item.priceAtSale).toString(),
        })

        // Create Stock Movement (Audit Trail)
        await tx.insert(stockMovements).values({
          organizationId,
          medicineId: item.medicineId,
          userId,
          type: "out",
          quantity: (-item.quantity).toString(), // Store negative for "out"
          priceAtTransaction: item.priceAtSale.toString(),
          resultingStock: newStock.toString(),
          reference: invoiceNumber,
          note: `Penjualan Kasir - ${invoiceNumber}`,
        })
      }

      return sale.id
    })

    // Fetch the full sale with items for the receipt
    const fullSale = await db.query.sales.findFirst({
      where: eq(sales.id, result),
      with: {
        items: {
          with: {
            medicine: {
              columns: {
                name: true
              }
            }
          }
        }
      }
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/inventory")
    revalidatePath("/dashboard/pos")
    return { data: fullSale }
  } catch (error: unknown) {
    console.error("Sale Error:", error)
    return { error: getErrorMessage(error) }
  }
}
