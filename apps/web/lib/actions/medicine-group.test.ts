import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMedicineGroups, createMedicineGroupAction, updateMedicineGroupAction, deleteMedicineGroupAction } from './medicine-group'
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
  then(resolve: any) { resolve([{ value: 0, id: '1', name: 'Group 1', color: '#000000' }]); }
}

vi.mock('@workspace/database', () => {
  return {
    db: {
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
    medicineGroups: {
      id: 'id',
      name: 'name',
      color: 'color',
      description: 'description',
      organizationId: 'organizationId',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
    medicines: {
      id: 'id',
      organizationId: 'organizationId',
      categoryId: 'categoryId',
      groupId: 'groupId',
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
  desc: vi.fn(),
  sql: vi.fn(),
}))

describe('Medicine Group Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMedicineGroups', () => {
    it('should throw Unauthorized error if no organizationId is in session', async () => {
      (vi.mocked(auth) as any).mockResolvedValue(null)

      await expect(getMedicineGroups()).rejects.toThrow('Unauthorized')
    })

    it('should return groups and metadata successfully', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockData = [{ id: '1', name: 'Group 1', color: '#000000', value: 0 }]

      const result = await getMedicineGroups(1, 10, 'Group')

      expect(result).toEqual({
        data: mockData,
        metadata: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        }
      })
      expect(db.select).toHaveBeenCalled()
    })

    it('should handle errors and return default empty result', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      vi.mocked(db.select).mockImplementationOnce(() => { throw new Error('Database error') })

      const result = await getMedicineGroups()

      expect(result).toEqual({
        data: [],
        metadata: { total: 0, page: 1, limit: 10, totalPages: 0 }
      })
    })
  })

  describe('createMedicineGroupAction', () => {
    it('should return Unauthorized if no organizationId is in session', async () => {
      (vi.mocked(auth) as any).mockResolvedValue(null)

      const formData = new FormData()
      const result = await createMedicineGroupAction({}, formData)

      expect(result).toEqual({ message: 'Unauthorized' })
    })

    it('should return errors if validation fails', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const formData = new FormData()
      formData.append('name', 'a') // Too short
      formData.append('color', 'black') // Invalid hex

      const result = await createMedicineGroupAction({}, formData)

      expect(result).toMatchObject({
        errors: { 
          name: ['Nama golongan minimal 2 karakter'],
          color: ['Warna harus berupa kode hex (misal: #3b82f6)']
        },
        message: 'Gagal membuat golongan. Mohon periksa input Anda.',
      })
    })

    it('should successfully create group', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockInsert = { values: vi.fn().mockResolvedValue({}) }
      vi.mocked(db.insert).mockReturnValue(mockInsert as any)

      const formData = new FormData()
      formData.append('name', 'Group 1')
      formData.append('color', '#123456')

      const result = await createMedicineGroupAction({}, formData)

      expect(result).toEqual({ message: 'Golongan berhasil dibuat!', success: true })
      expect(db.insert).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/inventory/categories')
    })

    it('should handle system errors during creation', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockInsert = { values: vi.fn().mockRejectedValue(new Error('DB Error')) }
      vi.mocked(db.insert).mockReturnValue(mockInsert as any)

      const formData = new FormData()
      formData.append('name', 'Group 1')
      formData.append('color', '#123456')

      const result = await createMedicineGroupAction({}, formData)

      expect(result).toEqual({ message: 'Terjadi kesalahan sistem: DB Error' })
    })
  })

  describe('updateMedicineGroupAction', () => {
    it('should return Unauthorized if no organizationId is in session', async () => {
      (vi.mocked(auth) as any).mockResolvedValue(null)

      const formData = new FormData()
      const result = await updateMedicineGroupAction('group-1', {}, formData)

      expect(result).toEqual({ message: 'Unauthorized' })
    })

    it('should return errors if validation fails', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const formData = new FormData()
      formData.append('name', 'a') // Too short
      formData.append('color', '#123456')

      const result = await updateMedicineGroupAction('group-1', {}, formData)

      expect(result).toMatchObject({
        errors: { name: ['Nama golongan minimal 2 karakter'] },
        message: 'Gagal memperbarui golongan. Mohon periksa input Anda.',
      })
    })

    it('should return message if group not found or access denied', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]) // Simulate not found
      }
      vi.mocked(db.update).mockReturnValue(mockUpdate as any)

      const formData = new FormData()
      formData.append('name', 'Group Updated')
      formData.append('color', '#123456')

      const result = await updateMedicineGroupAction('group-1', {}, formData)

      expect(result).toEqual({ message: 'Golongan tidak ditemukan atau akses ditolak.' })
    })

    it('should successfully update group', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'group-1' }]) // Simulate updated
      }
      vi.mocked(db.update).mockReturnValue(mockUpdate as any)

      const formData = new FormData()
      formData.append('name', 'Group Updated')
      formData.append('color', '#123456')

      const result = await updateMedicineGroupAction('group-1', {}, formData)

      expect(result).toEqual({ message: 'Golongan berhasil diperbarui!', success: true })
      expect(db.update).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/inventory/categories')
    })

    it('should handle system errors during update', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockRejectedValue(new Error('Update failed'))
      }
      vi.mocked(db.update).mockReturnValue(mockUpdate as any)

      const formData = new FormData()
      formData.append('name', 'Group Updated')
      formData.append('color', '#123456')

      const result = await updateMedicineGroupAction('group-1', {}, formData)

      expect(result).toEqual({ message: 'Terjadi kesalahan sistem: Update failed' })
    })
  })

  describe('deleteMedicineGroupAction', () => {
    it('should return Unauthorized if no organizationId is in session', async () => {
      (vi.mocked(auth) as any).mockResolvedValue(null)

      const result = await deleteMedicineGroupAction('group-1')

      expect(result).toEqual({ message: 'Unauthorized' })
    })

    it('should return message if group not found or access denied', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]) // Simulate not found
      }
      vi.mocked(db.delete).mockReturnValue(mockDelete as any)

      const result = await deleteMedicineGroupAction('group-1')

      expect(result).toEqual({ message: 'Golongan tidak ditemukan atau akses ditolak.' })
    })

    it('should successfully delete group', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'group-1' }]) // Simulate deleted
      }
      vi.mocked(db.delete).mockReturnValue(mockDelete as any)

      const result = await deleteMedicineGroupAction('group-1')

      expect(result).toEqual({ message: 'Golongan berhasil dihapus!', success: true })
      expect(db.delete).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/inventory/categories')
    })

    it('should handle system errors during deletion', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockRejectedValue(new Error('Delete failed'))
      }
      vi.mocked(db.delete).mockReturnValue(mockDelete as any)

      const result = await deleteMedicineGroupAction('group-1')

      expect(result).toEqual({ message: 'Terjadi kesalahan sistem: Delete failed' })
    })
  })
})
