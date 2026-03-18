import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSalesReportAction } from './report'
import { auth } from '@/auth'
import { db } from '@workspace/database'

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@workspace/database', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          groupBy: vi.fn(() => ({
            orderBy: vi.fn().mockResolvedValue([]),
          })),
        })),
        innerJoin: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              groupBy: vi.fn(() => ({
                orderBy: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue([]),
                })),
              })),
            })),
          })),
          where: vi.fn(() => ({
            groupBy: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([]),
              })),
            })),
          })),
        })),
      })),
    })),
    query: {
      sales: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
  },
  sales: {
    id: 'id',
    totalAmount: 'totalAmount',
    organizationId: 'organizationId',
    createdAt: 'createdAt',
  },
  saleItems: {
    id: 'id',
    saleId: 'saleId',
    medicineId: 'medicineId',
    quantity: 'quantity',
    purchasePriceAtSale: 'purchasePriceAtSale',
    priceAtSale: 'priceAtSale',
    totalPrice: 'totalPrice',
  },
  medicines: {
    id: 'id',
    name: 'name',
  },
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  sql: vi.fn(),
  desc: vi.fn(),
}))

describe('getSalesReportAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw an error if user is not authenticated', async () => {
    (vi.mocked(auth) as any).mockResolvedValue(null)

    const filter = { startDate: new Date(), endDate: new Date() }

    await expect(getSalesReportAction(filter)).rejects.toThrow('Akses ditolak. Hanya Admin yang dapat melihat laporan.')
  })

  it('should throw an error if user has no organizationId', async () => {
    (vi.mocked(auth) as any).mockResolvedValue({ user: { role: 'admin' } } as any)

    const filter = { startDate: new Date(), endDate: new Date() }

    await expect(getSalesReportAction(filter)).rejects.toThrow('Akses ditolak. Hanya Admin yang dapat melihat laporan.')
  })

  it('should throw an error if user role is not admin', async () => {
    (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1', role: 'staff' } } as any)

    const filter = { startDate: new Date(), endDate: new Date() }

    await expect(getSalesReportAction(filter)).rejects.toThrow('Akses ditolak. Hanya Admin yang dapat melihat laporan.')
  })

  it('should successfully fetch report data if user is an admin with an organizationId', async () => {
    (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1', role: 'admin' } } as any)

    const filter = { startDate: new Date(), endDate: new Date() }
    const result = await getSalesReportAction(filter)

    expect(result).toEqual({
      summary: {
        totalRevenue: 0,
        totalCogs: 0,
        grossProfit: 0,
        margin: 0
      },
      trend: [],
      topProducts: [],
      transactions: []
    })
  })
})
