import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUnitsAction, createUnitAction, updateUnitAction, deleteUnitAction } from './unit'
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
  then(resolve: any) { resolve([{ count: 0, id: '1', name: 'Unit 1' }]); }
}

vi.mock('@workspace/database', () => {
  return {
    db: {
      query: {
        units: {
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
    units: {
      id: 'id',
      organizationId: 'organizationId',
      name: 'name',
      abbreviation: 'abbreviation',
    },
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
  asc: vi.fn(),
  sql: vi.fn(),
}))

describe('Unit Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUnitsAction', () => {
    it('should throw Unauthorized error if no organizationId is in session', async () => {
      (vi.mocked(auth) as any).mockResolvedValue(null)

      await expect(getUnitsAction()).rejects.toThrow('Unauthorized')
    })

    it('should return units successfully', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockData = [{ id: '1', name: 'Box' }]
      vi.mocked(db.query.units.findMany).mockResolvedValue(mockData as any)

      const result = await getUnitsAction()

      expect(result).toEqual({
        data: mockData,
        metadata: {
          limit: 10,
          page: 1,
          total: 0,
          totalPages: 0,
        }
      })
      expect(db.query.units.findMany).toHaveBeenCalled()
      expect(db.select).toHaveBeenCalled()
    })

    it('should handle search filter', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockData = [{ id: '1', name: 'Box' }]
      vi.mocked(db.query.units.findMany).mockResolvedValue(mockData as any)

      const result = await getUnitsAction(1, 10, 'Box')

      expect(result.data).toEqual(mockData)
      expect(db.query.units.findMany).toHaveBeenCalled()
    })
  })

  describe('createUnitAction', () => {
    it('should return Unauthorized if no organizationId is in session', async () => {
      (vi.mocked(auth) as any).mockResolvedValue(null)

      const formData = new FormData()
      const result = await createUnitAction({}, formData)

      expect(result).toEqual({ message: 'Unauthorized' })
    })

    it('should return errors if validation fails', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const formData = new FormData()
      formData.append('name', '') // Invalid name

      const result = await createUnitAction({}, formData)

      expect(result).toMatchObject({
        message: 'Gagal membuat satuan. Mohon periksa input Anda.',
      })
      expect(result.errors).toBeDefined()
    })

    it('should successfully create unit', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockInsert = { values: vi.fn().mockResolvedValue({}) }
      vi.mocked(db.insert).mockReturnValue(mockInsert as any)

      const formData = new FormData()
      formData.append('name', 'Box')
      formData.append('abbreviation', 'bx')

      const result = await createUnitAction({}, formData)

      expect(result).toEqual({ message: 'Satuan berhasil dibuat', success: true })
      expect(db.insert).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/inventory/master/units')
    })
  })

  describe('updateUnitAction', () => {
    it('should successfully update unit', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockUpdate = {
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }
      vi.mocked(db.update).mockReturnValue(mockUpdate as any)

      const formData = new FormData()
      formData.append('name', 'Box Updated')
      formData.append('abbreviation', 'bx-u')

      const result = await updateUnitAction('unit-1', {}, formData)

      expect(result).toEqual({ message: 'Satuan berhasil diperbarui', success: true })
      expect(db.update).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/inventory/master/units')
    })
  })

  describe('deleteUnitAction', () => {
    it('should successfully delete unit', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockDelete = {
        where: vi.fn().mockResolvedValue({}),
      }
      vi.mocked(db.delete).mockReturnValue(mockDelete as any)

      const result = await deleteUnitAction('unit-1')

      expect(result).toEqual({ message: 'Satuan berhasil dihapus', success: true })
      expect(db.delete).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/inventory/master/units')
    })
  })
})
