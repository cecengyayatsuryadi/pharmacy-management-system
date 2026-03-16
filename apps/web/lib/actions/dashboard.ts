"use server"

import { auth } from "@/auth"
import { db, medicines, categories, sales } from "@workspace/database"
import { eq, sql, and, lte, gte, isNotNull } from "drizzle-orm"
import { startOfDay, endOfDay } from "date-fns"

export async function getDashboardStats() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("Unauthorized")
  }

  const todayStart = startOfDay(new Date())
  const todayEnd = endOfDay(new Date())

  // 1. Omzet & Transaksi Hari Ini
  const todaySalesResult = await db
    .select({
      revenue: sql<number>`COALESCE(SUM(CAST(${sales.totalAmount} AS NUMERIC)), 0)`,
      count: sql<number>`COUNT(${sales.id})`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.organizationId, organizationId),
        gte(sales.createdAt, todayStart),
        lte(sales.createdAt, todayEnd)
      )
    )

  const todayRevenue = Number(todaySalesResult[0]?.revenue || 0)
  const todayTransactions = Number(todaySalesResult[0]?.count || 0)

  // 2. Total Nilai Stok
  const stockValueResult = await db
    .select({
      totalValue: sql<number>`COALESCE(SUM(CAST(${medicines.purchasePrice} AS NUMERIC) * CAST(${medicines.stock} AS NUMERIC)), 0)`,
    })
    .from(medicines)
    .where(eq(medicines.organizationId, organizationId))

  const totalStockValue = Number(stockValueResult[0]?.totalValue || 0)

  // 3. Sebaran Kategori
  const categoryDistribution = await db
    .select({
      name: categories.name,
      count: sql<number>`COUNT(${medicines.id})`,
    })
    .from(medicines)
    .innerJoin(categories, eq(medicines.categoryId, categories.id))
    .where(eq(medicines.organizationId, organizationId))
    .groupBy(categories.name)

  // 4. Stok Kritis
  const criticalItems = await db
    .select({
      id: medicines.id,
      name: medicines.name,
      stock: medicines.stock,
      minStock: medicines.minStock,
    })
    .from(medicines)
    .where(
      and(
        sql`CAST(${medicines.stock} AS NUMERIC) <= CAST(${medicines.minStock} AS NUMERIC)`,
        eq(medicines.organizationId, organizationId)
      )
    )
    .limit(5)

  const criticalStockCountResult = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(medicines)
    .where(
      and(
        sql`CAST(${medicines.stock} AS NUMERIC) <= CAST(${medicines.minStock} AS NUMERIC)`,
        eq(medicines.organizationId, organizationId)
      )
    )

  // 5. Obat Akan Kadaluarsa (6 Bulan)
  const sixMonthsFromNow = new Date()
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)

  const expiringItems = await db
    .select({
      id: medicines.id,
      name: medicines.name,
      expiryDate: medicines.expiryDate,
      stock: medicines.stock,
    })
    .from(medicines)
    .where(
      and(
        eq(medicines.organizationId, organizationId),
        isNotNull(medicines.expiryDate),
        lte(medicines.expiryDate, sixMonthsFromNow),
        gte(medicines.expiryDate, new Date()) // Belum lewat hari ini
      )
    )
    .orderBy(medicines.expiryDate)
    .limit(5)

  const expiringCountResult = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(medicines)
    .where(
      and(
        eq(medicines.organizationId, organizationId),
        isNotNull(medicines.expiryDate),
        lte(medicines.expiryDate, sixMonthsFromNow),
        gte(medicines.expiryDate, new Date())
      )
    )

  return {
    todayRevenue,
    todayTransactions,
    totalStockValue,
    categoryDistribution,
    criticalStockCount: Number(criticalStockCountResult[0]?.count || 0),
    criticalItems,
    expiringItems,
    expiringCount: Number(expiringCountResult[0]?.count || 0),
  }
}
