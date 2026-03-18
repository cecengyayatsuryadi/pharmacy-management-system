"use server"

import { auth } from "@/auth"
import { db, medicineBatches, stockItems, warehouses } from "@workspace/database"
import { and, eq, gte } from "drizzle-orm"

export async function getBatchesAction(medicineId: string) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("Unauthorized")
  }

  // Fetch batches that have stock in any warehouse
  return await db
    .select({
      id: medicineBatches.id,
      batchNumber: medicineBatches.batchNumber,
      expiryDate: medicineBatches.expiryDate,
      totalQuantity: stockItems.quantity,
      warehouseName: warehouses.name,
      warehouseId: warehouses.id,
    })
    .from(medicineBatches)
    .innerJoin(stockItems, eq(medicineBatches.id, stockItems.batchId))
    .innerJoin(warehouses, eq(stockItems.warehouseId, warehouses.id))
    .where(and(
      eq(medicineBatches.medicineId, medicineId),
      eq(medicineBatches.organizationId, organizationId),
      gte(stockItems.quantity, "0.01") // Only batches with stock
    ))
}
