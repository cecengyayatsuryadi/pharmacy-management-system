"use server"

import { auth } from "@/auth"
import { db, stockItems, medicines, warehouses, medicineBatches } from "@workspace/database"
import { and, eq, ilike, or, count, desc } from "drizzle-orm"

export async function getStockItemsAction(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  warehouseId?: string
) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("Unauthorized")
  }

  const offset = (page - 1) * limit

  const whereClause = and(
    eq(stockItems.organizationId, organizationId),
    warehouseId ? eq(stockItems.warehouseId, warehouseId) : undefined,
    search ? ilike(medicines.name, `%${search}%`) : undefined
  )

  const data = await db
    .select({
      id: stockItems.id,
      quantity: stockItems.quantity,
      updatedAt: stockItems.updatedAt,
      medicine: {
        id: medicines.id,
        name: medicines.name,
        sku: medicines.sku,
        unit: medicines.unit,
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
    })
    .from(stockItems)
    .innerJoin(medicines, eq(stockItems.medicineId, medicines.id))
    .innerJoin(warehouses, eq(stockItems.warehouseId, warehouses.id))
    .leftJoin(medicineBatches, eq(stockItems.batchId, medicineBatches.id))
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(stockItems.updatedAt))

  const countResult = await db
    .select({ value: count() })
    .from(stockItems)
    .innerJoin(medicines, eq(stockItems.medicineId, medicines.id))
    .where(whereClause)

  const total = Number(countResult[0]?.value ?? 0)

  return {
    data,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}
