import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getConversionsAction, createConversionAction } from './conversion'
import { auth } from '@/auth'
import { db } from '@workspace/database'
import { revalidatePath } from 'next/cache'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

class MockQueryBuilder {
  from() { return this; }
  leftJoin() { return this; }
  where() { return this; }
  groupBy() { return this; }
  limit() { return this; }
  offset() { return this; }
  orderBy() { return this; }
  then(resolve: any) { resolve([{ value: 0, id: '1', name: 'Conv 1' }]); }
}

vi.mock('@workspace/database', () => {
  return {
    db: {
      query: {
        unitConversions: {
          findMany: vi.fn(),
        },
      },
      select: vi.fn(() => new MockQueryBuilder()),
      insert: vi.fn(() => ({
        values: vi.fn(),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    },
    unitConversions: {
      id: 'id',
      organizationId: 'organizationId',
      medicineId: 'medicineId',
      fromUnitId: 'fromUnitId',
      toUnitId: 'toUnitId',
      factor: 'factor',
    },
    medicines: {
      id: 'id',
    },
    units: {
      id: 'id',
    }
  }
})

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  count: vi.fn(),
  ilike: vi.fn(),
  or: vi.fn(),
  desc: vi.fn(),
  sql: vi.fn(),
}))

describe('Conversion Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getConversionsAction', () => {
    it('should throw Unauthorized error if no organizationId is in session', async () => {
      (vi.mocked(auth) as any).mockResolvedValue(null)

      await expect(getConversionsAction()).rejects.toThrow('Unauthorized')
    })

    it('should return conversions successfully', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockData = [{ id: '1', factor: '10' }]
      vi.mocked(db.query.unitConversions.findMany).mockResolvedValue(mockData as any)

      const result = await getConversionsAction()

      expect(result).toEqual(mockData)
      expect(db.query.unitConversions.findMany).toHaveBeenCalled()
    })

    it('should handle medicineId filter', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockData = [{ id: '1', factor: '10' }]
      vi.mocked(db.query.unitConversions.findMany).mockResolvedValue(mockData as any)

      const result = await getConversionsAction('med-1')

      expect(result).toEqual(mockData)
      expect(db.query.unitConversions.findMany).toHaveBeenCalled()
    })
  })

  describe('createConversionAction', () => {
    it('should return Unauthorized if no organizationId is in session', async () => {
      (vi.mocked(auth) as any).mockResolvedValue(null)

      const formData = new FormData()
      const result = await createConversionAction({}, formData)

      expect(result).toEqual({ message: 'Unauthorized' })
    })

    it('should return errors if validation fails', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const formData = new FormData()
      formData.append('factor', '-5') // Invalid factor

      const result = await createConversionAction({}, formData)

      expect(result).toMatchObject({
        message: 'Gagal membuat konversi. Mohon periksa input Anda.',
      })
      expect(result.errors).toBeDefined()
    })

    it('should successfully create conversion', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockInsert = { values: vi.fn().mockResolvedValue({}) }
      vi.mocked(db.insert).mockReturnValue(mockInsert as any)

      const formData = new FormData()
      formData.append('medicineId', '123e4567-e89b-12d3-a456-426614174000')
      formData.append('fromUnitId', '123e4567-e89b-12d3-a456-426614174001')
      formData.append('toUnitId', '123e4567-e89b-12d3-a456-426614174002')
      formData.append('factor', '10')

      const result = await createConversionAction({}, formData)

      expect(result).toEqual({ message: 'Konversi berhasil dibuat', success: true })
      expect(db.insert).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/inventory/master/units')
    })
  })
})
