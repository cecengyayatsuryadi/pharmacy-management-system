import { beforeEach, describe, expect, it, vi } from "vitest"
import { auth } from "@/auth"
import { db } from "@workspace/database"
import { getDashboardStats } from "./dashboard"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@workspace/database", () => ({
  db: {
    select: vi.fn(),
  },
  medicines: {
    id: "id",
    name: "name",
    stock: "stock",
    minStock: "minStock",
    purchasePrice: "purchasePrice",
    organizationId: "organizationId",
    categoryId: "categoryId",
    expiryDate: "expiryDate",
  },
  categories: {
    id: "id",
    name: "name",
  },
  sales: {
    id: "id",
    totalAmount: "totalAmount",
    organizationId: "organizationId",
    createdAt: "createdAt",
  },
}))

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  sql: vi.fn(),
  and: vi.fn(),
  lte: vi.fn(),
  gte: vi.fn(),
  isNotNull: vi.fn(),
}))

function makeQueryResult<T>(value: T) {
  const q: any = {
    from: () => q,
    where: () => q,
    innerJoin: () => q,
    groupBy: () => q,
    limit: () => q,
    orderBy: () => q,
    then: (resolve: (v: T) => unknown) => Promise.resolve(resolve(value)),
  }
  return q
}

describe("getDashboardStats", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should throw Unauthorized when organizationId is missing", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    await expect(getDashboardStats()).rejects.toThrow("Unauthorized")
  })

  it("should return zero-safe stats when sales/stocks/categories are empty", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { organizationId: "org-1" },
    } as any)

    const selectResults = [
      [{ revenue: 0, count: 0 }], // today sales
      [{ totalValue: 0 }], // stock value
      [], // category distribution
      [], // critical items
      [{ count: 0 }], // critical count
      [], // expiring items
      [{ count: 0 }], // expiring count
    ]
    let i = 0
    vi.mocked(db.select).mockImplementation(() => makeQueryResult(selectResults[i++]))

    const result = await getDashboardStats()

    expect(result).toEqual({
      todayRevenue: 0,
      todayTransactions: 0,
      totalStockValue: 0,
      categoryDistribution: [],
      criticalStockCount: 0,
      criticalItems: [],
      expiringItems: [],
      expiringCount: 0,
    })
    expect(db.select).toHaveBeenCalledTimes(7)
  })
})

