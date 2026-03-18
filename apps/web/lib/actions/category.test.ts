import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCategories, createCategoryAction, updateCategoryAction, deleteCategoryAction } from './category'
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
  then(resolve: any) { resolve([{ value: 0, id: '1', name: 'Cat 1' }]); } // Default value: 0 for count
}

vi.mock('@workspace/database', () => {
  return {
    db: {
      query: {
        categories: {
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
    categories: {
      id: 'id',
      name: 'name',
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

describe('Category Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCategories', () => {
    it('should throw Unauthorized error if no organizationId is in session', async () => {
      (vi.mocked(auth) as any).mockResolvedValue(null)

      await expect(getCategories()).rejects.toThrow('Unauthorized')
    })

    it('should return categories and metadata successfully', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockData = [{ id: '1', name: 'Cat 1', value: 0 }]

      // Use global mock that supports leftJoin and then()
      const result = await getCategories(1, 10, 'Cat')

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

      // Override select to throw error
      vi.mocked(db.select).mockImplementationOnce(() => { throw new Error('Database error') })

      const result = await getCategories()

      expect(result).toEqual({
        data: [],
        metadata: { total: 0, page: 1, limit: 10, totalPages: 0 }
      })
    })
  })

  describe('createCategoryAction', () => {
    it('should return Unauthorized if no organizationId is in session', async () => {
      (vi.mocked(auth) as any).mockResolvedValue(null)

      const formData = new FormData()
      const result = await createCategoryAction({}, formData)

      expect(result).toEqual({ message: 'Unauthorized' })
    })

    it('should return errors if validation fails', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const formData = new FormData()
      formData.append('name', 'a') // Too short

      const result = await createCategoryAction({}, formData)

      expect(result).toMatchObject({
        errors: { name: ['Nama kategori minimal 2 karakter'] },
        message: 'Gagal membuat kategori. Mohon periksa input Anda.',
      })
    })

    it('should successfully create category', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockInsert = { values: vi.fn().mockResolvedValue({}) }
      vi.mocked(db.insert).mockReturnValue(mockInsert as any)

      const formData = new FormData()
      formData.append('name', 'Category 1')

      const result = await createCategoryAction({}, formData)

      expect(result).toEqual({ message: 'Kategori berhasil dibuat!', success: true })
      expect(db.insert).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/inventory/categories')
    })

    it('should handle system errors during creation', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockInsert = { values: vi.fn().mockRejectedValue(new Error('DB Error')) }
      vi.mocked(db.insert).mockReturnValue(mockInsert as any)

      const formData = new FormData()
      formData.append('name', 'Category 1')

      const result = await createCategoryAction({}, formData)

      expect(result).toEqual({ message: 'Terjadi kesalahan sistem: DB Error' })
    })
  })

  describe('updateCategoryAction', () => {
    it('should return Unauthorized if no organizationId is in session', async () => {
      (vi.mocked(auth) as any).mockResolvedValue(null)

      const formData = new FormData()
      const result = await updateCategoryAction('cat-1', {}, formData)

      expect(result).toEqual({ message: 'Unauthorized' })
    })

    it('should return errors if validation fails', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const formData = new FormData()
      formData.append('name', 'a') // Too short

      const result = await updateCategoryAction('cat-1', {}, formData)

      expect(result).toMatchObject({
        errors: { name: ['Nama kategori minimal 2 karakter'] },
        message: 'Gagal memperbarui kategori. Mohon periksa input Anda.',
      })
    })

    it('should return message if category not found or access denied', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]) // Simulate not found
      }
      vi.mocked(db.update).mockReturnValue(mockUpdate as any)

      const formData = new FormData()
      formData.append('name', 'Category Updated')

      const result = await updateCategoryAction('cat-1', {}, formData)

      expect(result).toEqual({ message: 'Kategori tidak ditemukan atau akses ditolak.' })
    })

    it('should successfully update category', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'cat-1' }]) // Simulate updated
      }
      vi.mocked(db.update).mockReturnValue(mockUpdate as any)

      const formData = new FormData()
      formData.append('name', 'Category Updated')

      const result = await updateCategoryAction('cat-1', {}, formData)

      expect(result).toEqual({ message: 'Kategori berhasil diperbarui!', success: true })
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
      formData.append('name', 'Category Updated')

      const result = await updateCategoryAction('cat-1', {}, formData)

      expect(result).toEqual({ message: 'Terjadi kesalahan sistem: Update failed' })
    })
  })

  describe('deleteCategoryAction', () => {
    it('should return Unauthorized if no organizationId is in session', async () => {
      (vi.mocked(auth) as any).mockResolvedValue(null)

      const result = await deleteCategoryAction('cat-1')

      expect(result).toEqual({ message: 'Unauthorized' })
    })

    it('should return message if category not found or access denied', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]) // Simulate not found
      }
      vi.mocked(db.delete).mockReturnValue(mockDelete as any)

      const result = await deleteCategoryAction('cat-1')

      expect(result).toEqual({ message: 'Kategori tidak ditemukan atau akses ditolak.' })
    })

    it('should successfully delete category', async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ user: { organizationId: 'org-1' } } as any)

      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'cat-1' }]) // Simulate deleted
      }
      vi.mocked(db.delete).mockReturnValue(mockDelete as any)

      const result = await deleteCategoryAction('cat-1')

      expect(result).toEqual({ message: 'Kategori berhasil dihapus!', success: true })
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

      const result = await deleteCategoryAction('cat-1')

      expect(result).toEqual({ message: 'Terjadi kesalahan sistem: Delete failed' })
    })
  })
})
