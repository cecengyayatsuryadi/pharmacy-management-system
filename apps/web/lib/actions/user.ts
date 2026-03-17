"use server"

import { auth } from "@/auth"
import { db, users } from "@workspace/database"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { getErrorMessage } from "@/lib/utils/error"

const profileSchema = z.object({
  name: z.string({ required_error: "Nama minimal 2 karakter" }).min(2, { message: "Nama minimal 2 karakter" }),
  phone: z.string().optional().nullable(),
})

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Password saat ini harus diisi" }),
    newPassword: z
      .string()
      .min(6, { message: "Password baru minimal 6 karakter" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Konfirmasi password minimal 6 karakter" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  })

export async function updateProfileAction(prevState: unknown, formData: FormData) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { message: "Unauthorized" }
  }

  const validatedFields = profileSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal memperbarui profil. Mohon periksa input Anda.",
    }
  }

  try {
    await db
      .update(users)
      .set({
        name: validatedFields.data.name,
        phone: validatedFields.data.phone,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    revalidatePath("/dashboard/settings")
    return { message: "Profil berhasil diperbarui!", success: true }
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" || error.name === "NextRedirect")
    ) {
      throw error
    }
    console.error("UPDATE_PROFILE_ERROR:", error)
    return { message: `Terjadi kesalahan sistem: ${getErrorMessage(error)}` }
  }
}

export async function updatePasswordAction(prevState: unknown, formData: FormData) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { message: "Unauthorized" }
  }

  const validatedFields = passwordSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal memperbarui password. Mohon periksa input Anda.",
    }
  }

  const { currentPassword, newPassword } = validatedFields.data

  try {
    // 1. Get user to check current password
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user || !user.password) {
      return { message: "User tidak ditemukan" }
    }

    // 2. Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password)
    if (!passwordMatch) {
      return {
        errors: { currentPassword: ["Password saat ini salah"] },
        message: "Password saat ini salah.",
      }
    }

    // 3. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 4. Update password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    return { message: "Password berhasil diperbarui!", success: true }
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" || error.name === "NextRedirect")
    ) {
      throw error
    }
    console.error("UPDATE_PASSWORD_ERROR:", error)
    return { message: `Terjadi kesalahan sistem: ${getErrorMessage(error)}` }
  }
}
