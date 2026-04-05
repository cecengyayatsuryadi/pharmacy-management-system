"use server"


import { db, medicines, sales, saleItems, saleReturns, saleReturnItems, stockMovements } from "@workspace/database"
import { eq, and, desc, asc, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getErrorMessage } from "@/lib/utils/error"
import { getAuthenticatedSession } from "@/lib/utils/action-utils"

const returnItemSchema = z.object({
  saleItemId: z.string().uuid(),
  medicineId: z.string().uuid(),
  quantityReturned: z.number().positive("Jumlah retur harus lebih dari 0"),
  refundAmount: z.number().nonnegative(),
})

const returnSchema = z.object({
  saleId: z.string().uuid("Sale ID tidak valid"),
  reason: z.string().min(1, "Alasan retur wajib diisi"),
  items: z.array(returnItemSchema).min(1, "Minimal 1 obat harus dipilih untuk diretur"),
})

export type ReturnInput = z.infer<typeof returnSchema>

export async function createReturnAction(data: ReturnInput) {
  const session = await getAuthenticatedSession()
  if (!session) return { error: "Unauthorized" }
  const { organizationId, userId } = session

  const validatedFields = returnSchema.safeParse(data)
  if (!validatedFields.success) {
    return {
      error: "Input tidak valid",
      details: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { saleId, reason, items } = validatedFields.data

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Validate original sale exists and belongs to org
      const sale = await tx.query.sales.findFirst({
        where: and(eq(sales.id, saleId), eq(sales.organizationId, organizationId)),
      })
      if (!sale) throw new Error("Transaksi tidak ditemukan")

      // 2. Fetch original sale items to validate return quantities
      const originalSaleItems = await tx.query.saleItems.findMany({
        where: eq(saleItems.saleId, saleId)
      })
      const originalItemsMap = new Map(originalSaleItems.map(i => [i.id, i]))

      // Also fetch previous returns to ensure they don't return more than bought
      const previousReturnItems = await tx.query.saleReturnItems.findMany({
        where: inArray(saleReturnItems.saleItemId, originalSaleItems.map(i => i.id))
      })

      const previousReturnMap = new Map<string, number>()
      previousReturnItems.forEach(pri => {
        const current = previousReturnMap.get(pri.saleItemId) || 0
        previousReturnMap.set(pri.saleItemId, current + parseFloat(pri.quantityReturned))
      })

      // 3. Generate Return Number
      const today = new Date()
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")
      const lastReturn = await tx.query.saleReturns.findFirst({
        where: eq(saleReturns.organizationId, organizationId),
        orderBy: [desc(saleReturns.createdAt)],
      })
      let sequence = 1
      if (lastReturn && lastReturn.returnNumber.includes(dateStr)) {
        const lastSeq = parseInt(lastReturn.returnNumber.split("-").pop() || "0")
        sequence = lastSeq + 1
      }
      const returnNumber = `RET-${dateStr}-${sequence.toString().padStart(4, "0")}`

      // 4. Validate items and calculate total refund
      let totalRefundAmount = 0
      const uniqueMedicineIds = Array.from(new Set(items.map(i => i.medicineId)))

      const fetchedMedicines = await tx
        .select()
        .from(medicines)
        .where(
          and(
            inArray(medicines.id, uniqueMedicineIds),
            eq(medicines.organizationId, organizationId)
          )
        )
        .orderBy(asc(medicines.id))
        .for("update") // Lock for stock update

      const medicineMap = new Map(fetchedMedicines.map(m => [m.id, m]))

      for (const item of items) {
        const origItem = originalItemsMap.get(item.saleItemId)
        if (!origItem) throw new Error("Item transaksi tidak ditemukan")

        const prevReturned = previousReturnMap.get(item.saleItemId) || 0
        const maxReturnable = parseFloat(origItem.quantity) - prevReturned

        if (item.quantityReturned > maxReturnable) {
          throw new Error(`Jumlah retur melebihi maksimal yang bisa dikembalikan (Max: ${maxReturnable})`)
        }

        totalRefundAmount += item.refundAmount
      }

      // 5. Create Return Record
      const [saleReturn] = await tx.insert(saleReturns).values({
        organizationId,
        userId,
        saleId,
        returnNumber,
        reason,
        totalRefundAmount: totalRefundAmount.toString(),
        status: "COMPLETED",
      }).returning()

      // 6. Process Return Items & Stock Movements
      const saleReturnItemsToInsert = []
      const stockMovementsToInsert = []
      const medicineUpdatePromises = []
      const runningStockMap = new Map<string, number>()
      fetchedMedicines.forEach(m => runningStockMap.set(m.id, parseFloat(m.stock)))

      // Need to group returned quantities by medicineId for stock update
      const aggregatedReturns = items.reduce((acc, item) => {
        acc[item.medicineId] = (acc[item.medicineId] || 0) + item.quantityReturned
        return acc
      }, {} as Record<string, number>)

      for (const [medId, qty] of Object.entries(aggregatedReturns)) {
        const currentStock = runningStockMap.get(medId)!
        const newStock = currentStock + qty // Returning stock "IN"
        runningStockMap.set(medId, newStock)

        medicineUpdatePromises.push(
          tx.update(medicines)
            .set({ stock: newStock.toString(), updatedAt: new Date() })
            .where(eq(medicines.id, medId))
        )
      }

      for (const item of items) {
        saleReturnItemsToInsert.push({
          saleReturnId: saleReturn!.id,
          saleItemId: item.saleItemId,
          medicineId: item.medicineId,
          quantityReturned: item.quantityReturned.toString(),
          refundAmount: item.refundAmount.toString(),
        })

        // NOTE: If an item is returned, we need its price to log stock movement.
        // Best effort: original sale item priceAtSale
        const origItem = originalItemsMap.get(item.saleItemId)!
        const currentStock = runningStockMap.get(item.medicineId)!

        stockMovementsToInsert.push({
          organizationId,
          medicineId: item.medicineId,
          userId,
          type: "in" as const, // Retur means stock comes back IN
          quantity: item.quantityReturned.toString(),
          priceAtTransaction: origItem.priceAtSale,
          resultingStock: currentStock.toString(),
          reference: returnNumber,
          note: `Retur Penjualan - ${returnNumber} (${reason})`,
        })
      }

      if (medicineUpdatePromises.length > 0) await Promise.all(medicineUpdatePromises)
      if (saleReturnItemsToInsert.length > 0) await tx.insert(saleReturnItems).values(saleReturnItemsToInsert)
      if (stockMovementsToInsert.length > 0) await tx.insert(stockMovements).values(stockMovementsToInsert)

      // 7. Update Sale status to RETURNED if all items are fully returned (optional, but good UX)
      // For simplicity, we just mark status = "RETURNED" if there's any return for now.
      // status will not be updated here since there is no status in current branch sales schema

      return saleReturn!.id
    })

    revalidatePath("/dashboard/pos")
    revalidatePath("/dashboard/reports")
    revalidatePath("/dashboard/inventory")
    return { data: { id: result } }
  } catch (error: unknown) {
    return { error: getErrorMessage(error) }
  }
}

export async function getSaleForReturnAction(invoiceNumber: string) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) return { error: "Unauthorized" }

    const sale = await db.query.sales.findFirst({
      where: and(
        eq(sales.organizationId, session.organizationId),
        eq(sales.invoiceNumber, invoiceNumber)
      ),
      with: {
        items: {
          with: { medicine: true }
        },
        // In Drizzle, relations are named. If we added `returns: many(saleReturns)` we could fetch it.
        // For now, we will query returns separately to calculate what's left.
      }
    })

    if (!sale) return { error: "Transaksi tidak ditemukan" }

    const previousReturns = await db.query.saleReturns.findMany({
      where: eq(saleReturns.saleId, sale.id),
      with: { items: true }
    })

    // Map how many of each saleItemId has already been returned
    const returnedQtyMap: Record<string, number> = {}
    previousReturns.forEach(r => {
      r.items.forEach(i => {
        returnedQtyMap[i.saleItemId] = (returnedQtyMap[i.saleItemId] || 0) + parseFloat(i.quantityReturned)
      })
    })

    const itemsWithReturnState = sale.items.map(item => {
      const returned = returnedQtyMap[item.id] || 0
      const total = parseFloat(item.quantity)
      return {
        ...item,
        alreadyReturned: returned,
        returnable: total - returned
      }
    })

    return { data: { ...sale, items: itemsWithReturnState } }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }
}
