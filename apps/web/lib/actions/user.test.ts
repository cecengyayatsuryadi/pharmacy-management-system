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
        name: ['Nama minimal 2 karakter'],
      },
      message: 'Gagal memperbarui profil. Mohon periksa input Anda.',
    })
  })

  it('should not update database when validation fails (empty name)', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)

    const formData = new FormData()
    formData.append('name', '')
    formData.append('phone', '08123456789')

    const result = await updateProfileAction({}, formData)

    expect(result).toMatchObject({
      errors: {
        name: ['Nama minimal 2 karakter'],
      },
      message: 'Gagal memperbarui profil. Mohon periksa input Anda.',
    })
    expect(db.update).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
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

  it('should return generic error message when profile update fails', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)
    vi.mocked(db.update).mockReturnValueOnce({
      set: vi.fn(() => ({
        where: vi.fn().mockRejectedValue(new Error('DB connection timeout: internal detail')),
      })),
    } as any)

    const formData = new FormData()
    formData.append('name', 'John Doe')

    const result = await updateProfileAction({}, formData)

    expect(result).toEqual({
      message: 'Terjadi kesalahan sistem saat memperbarui profil.',
    })
  })
})
