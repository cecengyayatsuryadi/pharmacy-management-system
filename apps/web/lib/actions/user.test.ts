import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateProfileAction } from './user'
import { auth } from '@/auth'
import { db } from '@workspace/database'
import { revalidatePath } from 'next/cache'

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@workspace/database', () => ({
  db: {
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue({}),
      })),
    })),
  },
  users: {
    id: 'id',
    name: 'name',
    phone: 'phone',
    updatedAt: 'updatedAt',
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
}))

describe('updateProfileAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return Unauthorized if no user is in session', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const formData = new FormData()
    const result = await updateProfileAction({}, formData)

    expect(result).toEqual({ message: 'Unauthorized' })
  })

  it('should return errors if validation fails (name too short)', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)

    const formData = new FormData()
    formData.append('name', 'a')

    const result = await updateProfileAction({}, formData)

    expect(result).toMatchObject({
      errors: {
        name: ['Nama minimal 2 karakter'],
      },
      message: 'Gagal memperbarui profil. Mohon periksa input Anda.',
    })
  })

  it('should return errors if validation fails (name missing)', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)

    const formData = new FormData()

    const result = await updateProfileAction({}, formData)

    expect(result).toMatchObject({
      errors: {
        name: ['Required'],
      },
      message: 'Gagal memperbarui profil. Mohon periksa input Anda.',
    })
  })

  it('should successfully update profile with valid data', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)

    const formData = new FormData()
    formData.append('name', 'John Doe')
    formData.append('phone', '123456789')

    const result = await updateProfileAction({}, formData)

    expect(result).toEqual({
      message: 'Profil berhasil diperbarui!',
      success: true
    })
    expect(db.update).toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/settings')
  })
})
