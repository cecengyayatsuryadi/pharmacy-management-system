import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStockMovementAction } from './inventory'
import { auth } from '@/auth'
import { db } from '@workspace/database'
import { revalidatePath } from 'next/cache'

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@workspace/database', () => ({
  db: {
    transaction: vi.fn(),
  },
  medicines: {
    id: 'id',
    organizationId: 'organizationId',
    stock: 'stock',
    updatedAt: 'updatedAt',
    purchasePrice: 'purchasePrice',
    price: 'price',
  },
  stockMovements: {
    id: 'id',
    organizationId: 'organizationId',
    medicineId: 'medicineId',
    userId: 'userId',
    type: 'type',
    quantity: 'quantity',
    priceAtTransaction: 'priceAtTransaction',
    resultingStock: 'resultingStock',
    reference: 'reference',
    note: 'note',
    createdAt: 'createdAt',
  },
  stockItems: {
    id: 'id',
    organizationId: 'organizationId',
    warehouseId: 'warehouseId',
    medicineId: 'medicineId',
    quantity: 'quantity',
    updatedAt: 'updatedAt',
  },
  users: {
    id: 'id',
  }
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  desc: vi.fn(),
  ilike: vi.fn(),
  or: vi.fn(),
  sql: vi.fn(),
  count: vi.fn(),
}))

describe('createStockMovementAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default auth mock setup
    (vi.mocked(auth) as any).mockResolvedValue({
      user: {
        id: 'user-1',
        organizationId: 'org-1'
      }
    } as any)
  })

  it('should return Unauthorized if no user is in session', async () => {
    (vi.mocked(auth) as any).mockResolvedValue(null)
    const formData = new FormData()
    const result = await createStockMovementAction({}, formData)
    expect(result).toEqual({ message: 'Unauthorized' })
  })

  describe('Happy Paths', () => {
    it('should successfully create an "out" stock movement', async () => {
      const formData = new FormData()
      formData.append('medicineId', '123e4567-e89b-12d3-a456-426614174000') // valid UUID
      formData.append('warehouseId', '999e4567-e89b-12d3-a456-426614174000') // valid UUID
      formData.append('type', 'out')
      formData.append('quantity', '2')

      // Mock db.transaction callback
      const mockTx: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        for: vi.fn().mockResolvedValue([{
          id: '123e4567-e89b-12d3-a456-426614174000',
          quantity: '5',
          price: '150'
        }]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue({}),
        then: vi.fn((resolve) => resolve([{ total: '5' }])),
      }

      // Make db.transaction execute the callback with the mockTx
      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        return await cb(mockTx as any)
      })

      const result = await createStockMovementAction({}, formData)

      expect(result).toEqual({
        message: 'Transaksi stok berhasil dicatat',
        success: true
      })

      // Verify tx was called properly
      expect(mockTx.select).toHaveBeenCalled()
      expect(mockTx.update).toHaveBeenCalled()
      expect(mockTx.insert).toHaveBeenCalled()

      // Verify revalidation
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/medicines')
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/inventory/stock')
    })
  })

  describe('Error Paths', () => {
    it('should return error if medicine is not found', async () => {
      const formData = new FormData()
      formData.append('medicineId', '123e4567-e89b-12d3-a456-426614174000') // valid UUID
      formData.append('warehouseId', '999e4567-e89b-12d3-a456-426614174000') // valid UUID
      formData.append('type', 'out')
      formData.append('quantity', '5')

      // Mock db.transaction callback with empty array for medicine (not found)
      const mockTx: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        for: vi.fn().mockResolvedValue([]), // Return empty array -> medicine not found
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue({}),
        then: vi.fn((resolve) => resolve([])),
      }

      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        return await cb(mockTx as any)
      })

      const result = await createStockMovementAction({}, formData)

      expect(result).toEqual({
        message: "Stok fisik tidak mencukupi (Tersedia: 0). Gunakan fitur 'Pecah Satuan' jika stok ada dalam satuan besar."
      })
    })

    it('should return error if stock is insufficient for "out" transaction', async () => {
      const formData = new FormData()
      formData.append('medicineId', '123e4567-e89b-12d3-a456-426614174000') // valid UUID
      formData.append('warehouseId', '999e4567-e89b-12d3-a456-426614174000') // valid UUID
      formData.append('type', 'out')
      formData.append('quantity', '10') // Requesting 10

      // Mock db.transaction callback with medicine having 5 stock
      const mockTx: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        for: vi.fn().mockResolvedValue([{
          id: '123e4567-e89b-12d3-a456-426614174000',
          quantity: '5', // Current stock is less than 10
          price: '150'
        }]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue({}),
        then: vi.fn((resolve) => resolve([{ total: '5' }])),
      }

      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        return await cb(mockTx as any)
      })

      const result = await createStockMovementAction({}, formData)

      expect(result).toEqual({
        message: "Stok fisik tidak mencukupi (Tersedia: 5). Gunakan fitur 'Pecah Satuan' jika stok ada dalam satuan besar."
      })
    })

    it('should return error for invalid quantity format (<= 0)', async () => {
      const formData = new FormData()
      formData.append('medicineId', '123e4567-e89b-12d3-a456-426614174000') // valid UUID
      formData.append('warehouseId', '999e4567-e89b-12d3-a456-426614174000') // valid UUID
      formData.append('type', 'out')
      formData.append('quantity', '0') // quantity is 0, which is invalid for "in" or "out"

      const result = await createStockMovementAction({}, formData)

      expect(result).toMatchObject({
        errors: {
          quantity: ['Jumlah harus lebih dari 0 untuk transaksi masuk/keluar']
        },
        message: 'Gagal memproses stok. Mohon periksa input Anda.'
      })
    })
  })
})
