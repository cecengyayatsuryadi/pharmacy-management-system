"use server"

import { auth } from "@/auth"
import { db, sales, saleItems, medicines } from "@workspace/database"
import { eq, and, gte, lte, sql, desc } from "drizzle-orm"
import { getErrorMessage } from "@/lib/utils/error"

export interface ReportFilter {
  startDate: Date
  endDate: Date
}

export async function getSalesReportAction(filter: ReportFilter) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  const role = session?.user?.role

  if (!organizationId || role !== "admin") {
    throw new Error("Akses ditolak. Hanya Admin yang dapat melihat laporan.")
  }

  const { startDate, endDate } = filter

  // Set start of day and end of day
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  try {
    // 1. Summary Totals (Revenue, COGS, Profit)
    const revenueResult = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${sales.totalAmount} AS NUMERIC)), 0)`,
      })
      .from(sales)
      .where(
        and(
          eq(sales.organizationId, organizationId),
          gte(sales.createdAt, start),
          lte(sales.createdAt, end)
        )
      )

    const cogsResult = await db
      .select({
        totalCogs: sql<number>`COALESCE(SUM(CAST(${saleItems.purchasePriceAtSale} AS NUMERIC) * CAST(${saleItems.quantity} AS NUMERIC)), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(
        and(
          eq(sales.organizationId, organizationId),
          gte(sales.createdAt, start),
          lte(sales.createdAt, end)
        )
      )

    const totalRevenue = Number(revenueResult[0]?.totalRevenue || 0)
    const totalCogs = Number(cogsResult[0]?.totalCogs || 0)
    const grossProfit = totalRevenue - totalCogs
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    // 2. Daily Sales Trend (for Chart)
    const trendResult = await db
      .select({
        date: sql<string>`TO_CHAR(${sales.createdAt}, 'YYYY-MM-DD')`,
        revenue: sql<number>`COALESCE(SUM(CAST(${sales.totalAmount} AS NUMERIC)), 0)`,
      })
      .from(sales)
      .where(
        and(
          eq(sales.organizationId, organizationId),
          gte(sales.createdAt, start),
          lte(sales.createdAt, end)
        )
      )
      .groupBy(sql`TO_CHAR(${sales.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${sales.createdAt}, 'YYYY-MM-DD')`)

    // 3. Top Products by Profit & Volume
    const profitExpression = sql`SUM((CAST(${saleItems.priceAtSale} AS NUMERIC) - CAST(${saleItems.purchasePriceAtSale} AS NUMERIC)) * CAST(${saleItems.quantity} AS NUMERIC))`
    
    const topProducts = await db
      .select({
        name: medicines.name,
        quantity: sql<number>`COALESCE(SUM(CAST(${saleItems.quantity} AS NUMERIC)), 0)`,
        revenue: sql<number>`COALESCE(SUM(CAST(${saleItems.totalPrice} AS NUMERIC)), 0)`,
        profit: sql<number>`COALESCE(${profitExpression}, 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .innerJoin(medicines, eq(saleItems.medicineId, medicines.id))
      .where(
        and(
          eq(sales.organizationId, organizationId),
          gte(sales.createdAt, start),
          lte(sales.createdAt, end)
        )
      )
      .groupBy(medicines.name)
      .orderBy(desc(sql`COALESCE(${profitExpression}, 0)`))
      .limit(5)

    // 4. Recent Sales Transactions
    const recentSales = await db.query.sales.findMany({
      where: and(
        eq(sales.organizationId, organizationId),
        gte(sales.createdAt, start),
        lte(sales.createdAt, end)
      ),
      with: {
        user: {
          columns: {
            name: true
          }
        }
      },
      orderBy: [desc(sales.createdAt)],
      limit: 50
    })

    return {
      summary: {
        totalRevenue,
        totalCogs,
        grossProfit,
        margin
      },
      trend: trendResult,
      topProducts,
      transactions: recentSales
    }
  } catch (error: unknown) {
    console.error("REPORT_ACTION_ERROR:", error)
    throw new Error(`Gagal menarik data laporan: ${getErrorMessage(error)}`)
  }
}
