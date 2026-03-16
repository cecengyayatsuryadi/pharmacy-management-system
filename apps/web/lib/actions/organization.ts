"use server"

import { auth } from "@/auth"
import { db, organizations } from "@workspace/database"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const organizationSchema = z.object({
  name: z.string().min(3, "Nama apotek minimal 3 karakter"),
  address: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
})

export async function updateOrganizationAction(prevState: any, formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  const role = session?.user?.role

  if (!organizationId || role !== "admin") {
    return { message: "Hanya admin yang dapat mengubah pengaturan apotek." }
  }

  const validatedFields = organizationSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    description: formData.get("description"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal memperbarui data. Mohon periksa input Anda.",
    }
  }

  try {
    await db
      .update(organizations)
      .set({
        ...validatedFields.data,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))

    revalidatePath("/dashboard/settings/organization")
    return { success: true, message: "Pengaturan apotek berhasil diperbarui." }
  } catch (error) {
    return { message: "Terjadi kesalahan sistem saat memperbarui data." }
  }
}
