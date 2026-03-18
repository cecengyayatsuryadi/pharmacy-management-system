import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSaleAction } from './sale'
import { auth } from '@/auth'
import { db } from '@workspace/database'
import { revalidatePath } from 'next/cache'

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

const mockTransaction = {
  query: {
    sales: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  values: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  for: vi.fn(),
  returning: vi.fn(),
}

// Ensure the fluent chain works for insert and select
mockTransaction.insert.mockReturnValue(mockTransaction)
mockTransaction.values.mockReturnValue(mockTransaction)
mockTransaction.select.mockReturnValue(mockTransaction)
mockTransaction.from.mockReturnValue(mockTransaction)
mockTransaction.where.mockReturnValue(mockTransaction)
mockTransaction.orderBy.mockReturnValue(mockTransaction)
mockTransaction.for.mockReturnValue(mockTransaction)
mockTransaction.update.mockReturnValue({ set: vi.fn().mockReturnValue(mockTransaction) })
mockTransaction.returning.mockResolvedValue([{ id: 'mock-sale-id' }])
mockTransaction.for.mockResolvedValue([])

vi.mock('@workspace/database', () => ({
  db: {
    transaction: vi.fn((cb) => cb(mockTransaction)),
    query: {
      sales: {
        findFirst: vi.fn().mockResolvedValue({ id: 'mock-sale-id', items: [] }),
      },
    },
  },
  medicines: {
    id: 'medicineId',
    organizationId: 'organizationId',
  },
  sales: {
    organizationId: 'organizationId',
    createdAt: 'createdAt',
    id: 'id',
  },
  saleItems: {},
  stockMovements: {},
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  desc: vi.fn(),
  inArray: vi.fn(),
  asc: vi.fn(),
}))

describe('createSaleAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (vi.mocked(auth) as any).mockResolvedValue({
      user: { id: 'user-1', organizationId: 'org-1' },
      expires: '9999-12-31T23:59:59.999Z'
    })
  })

  it('should process a single item correctly', async () => {
    mockTransaction.for.mockResolvedValue([
      { id: '123e4567-e89b-12d3-a456-426614174000', stock: '10', purchasePrice: '5', name: 'Med 1' }
    ])

    const payload = {
      items: [{ medicineId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2, priceAtSale: 10 }],
      paymentMethod: 'cash',
      paidAmount: 20,
    }

    const result = await createSaleAction(payload)
    expect(result.error).toBeUndefined()
    expect(result.data).toBeDefined()
    expect(mockTransaction.insert).toHaveBeenCalledTimes(3) // sale, saleItems, stockMovements
    expect(mockTransaction.update).toHaveBeenCalledTimes(1) // medicines update
    expect(mockTransaction.select).toHaveBeenCalledTimes(1) // batched read
  })

  it('should correctly aggregate duplicate items', async () => {
    mockTransaction.for.mockResolvedValue([
      { id: '123e4567-e89b-12d3-a456-426614174000', stock: '10', purchasePrice: '5', name: 'Med 1' }
    ])

    const payload = {
      items: [
        { medicineId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2, priceAtSale: 10 },
        { medicineId: '123e4567-e89b-12d3-a456-426614174000', quantity: 3, priceAtSale: 10 }
      ], // total quantity 5
      paymentMethod: 'cash',
      paidAmount: 50,
    }

    const result = await createSaleAction(payload)
    expect(result.error).toBeUndefined()
    expect(result.data).toBeDefined()
    expect(mockTransaction.select).toHaveBeenCalledTimes(1)

    // sale (1), saleItems (1 batch of 2), stockMovements (1 batch of 2)
    // insert is called for sales, saleItems, stockMovements
    expect(mockTransaction.insert).toHaveBeenCalledTimes(3)

    // Update should only be called ONCE per unique medicine ID
    expect(mockTransaction.update).toHaveBeenCalledTimes(1)
  })

  it('should throw an error if stock is insufficient after aggregation', async () => {
    mockTransaction.for.mockResolvedValue([
      { id: '123e4567-e89b-12d3-a456-426614174000', stock: '4', purchasePrice: '5', name: 'Med 1' }
    ])

    const payload = {
      items: [
        { medicineId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2, priceAtSale: 10 },
        { medicineId: '123e4567-e89b-12d3-a456-426614174000', quantity: 3, priceAtSale: 10 } // 2+3=5, which is > 4
      ],
      paymentMethod: 'cash',
      paidAmount: 50,
    }

    const result = await createSaleAction(payload)
    expect(result.error).toContain('Stok tidak cukup')
  })

  it('should throw an error if medicine is not found (or outside tenant scope)', async () => {
    mockTransaction.for.mockResolvedValue([]) // Empty array meaning nothing found

    const payload = {
      items: [{ medicineId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2, priceAtSale: 10 }],
      paymentMethod: 'cash',
      paidAmount: 20,
    }

    const result = await createSaleAction(payload)
    expect(result.error).toContain('Obat tidak ditemukan')
  })
})
