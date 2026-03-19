"use server"

import { auth } from "@/auth"
import { db, medicineGroups, medicines } from "@workspace/database"
import { eq, and, count, ilike, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getErrorMessage } from "@/lib/utils/error"

const medicineGroupSchema = z.object({
  name: z.string().min(2, { message: "Nama golongan minimal 2 karakter" }),
  color: z.string().startsWith("#", { message: "Warna harus berupa kode hex (misal: #3b82f6)" }),
  description: z.string().optional(),
})

export async function getMedicineGroups(page = 1, limit = 10, search = "") {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("Unauthorized")
  }

  const offset = (page - 1) * limit
  const whereClause = eq(medicineGroups.organizationId, organizationId)

  try {
    const data = await db
      .select({
        id: medicineGroups.id,
        organizationId: medicineGroups.organizationId,
        name: medicineGroups.name,
        color: medicineGroups.color,
        description: medicineGroups.description,
        createdAt: medicineGroups.createdAt,
        updatedAt: medicineGroups.updatedAt,
        medicinesCount: count(medicines.id),
      })
      .from(medicineGroups)
      .leftJoin(medicines, eq(medicines.groupId, medicineGroups.id))
      .where(
        and(
          whereClause,
          search ? ilike(medicineGroups.name, `%${search}%`) : undefined
        )
      )
      .groupBy(medicineGroups.id)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${medicineGroups.createdAt} DESC`)

    const countResult = await db
      .select({ value: count() })
      .from(medicineGroups)
      .where(
        and(
          whereClause,
          search ? ilike(medicineGroups.name, `%${search}%`) : undefined
        )
      )

    const total = countResult[0]?.value ?? 0

    return {
      data,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }
  } catch (error) {
    console.error("GET_MEDICINE_GROUPS_ERROR:", error)
    return { data: [], metadata: { total: 0, page: 1, limit: 10, totalPages: 0 } }
  }
}

export async function createMedicineGroupAction(prevState: any, formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { message: "Unauthorized" }
  }

  const validatedFields = medicineGroupSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal membuat golongan. Mohon periksa input Anda.",
    }
  }

  try {
    await db.insert(medicineGroups).values({
      name: validatedFields.data.name,
      color: validatedFields.data.color,
      description: validatedFields.data.description,
      organizationId,
    })

    revalidatePath("/dashboard/inventory/master/categories")
    return { message: "Golongan berhasil dibuat!", success: true }
  } catch (error: unknown) {
    console.error("CREATE_MEDICINE_GROUP_ERROR:", error)
    return { message: `Terjadi kesalahan sistem: ${getErrorMessage(error)}` }
  }
}

export async function updateMedicineGroupAction(
  id: string,
  prevState: any,
  formData: FormData
) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { message: "Unauthorized" }
  }

  const validatedFields = medicineGroupSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal memperbarui golongan. Mohon periksa input Anda.",
    }
  }

  try {
    const [updated] = await db
      .update(medicineGroups)
      .set({
        name: validatedFields.data.name,
        color: validatedFields.data.color,
        description: validatedFields.data.description,
        updatedAt: new Date(),
      })
      .where(
        and(eq(medicineGroups.id, id), eq(medicineGroups.organizationId, organizationId))
      )
      .returning()

    if (!updated) {
      return { message: "Golongan tidak ditemukan atau akses ditolak." }
    }

    revalidatePath("/dashboard/inventory/master/categories")
    return { message: "Golongan berhasil diperbarui!", success: true }
  } catch (error: unknown) {
    console.error("UPDATE_MEDICINE_GROUP_ERROR:", error)
    return { message: `Terjadi kesalahan sistem: ${getErrorMessage(error)}` }
  }
}

export async function deleteMedicineGroupAction(id: string) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { message: "Unauthorized" }
  }

  try {
    // Cek apakah ada produk yang menggunakan golongan ini
    const products = await db
      .select({ value: count() })
      .from(medicines)
      .where(and(eq(medicines.groupId, id), eq(medicines.organizationId, organizationId)))

    if ((products[0]?.value ?? 0) > 0) {
      return { 
        message: `Gagal menghapus! Masih ada ${products[0]?.value} produk yang menggunakan golongan ini.`, 
        success: false 
      }
    }

    const [deleted] = await db
      .delete(medicineGroups)
      .where(
        and(eq(medicineGroups.id, id), eq(medicineGroups.organizationId, organizationId))
      )
      .returning()

    if (!deleted) {
      return { message: "Golongan tidak ditemukan atau akses ditolak." }
    }

    revalidatePath("/dashboard/inventory/master/categories")
    return { message: "Golongan berhasil dihapus!", success: true }
  } catch (error: unknown) {
    console.error("DELETE_MEDICINE_GROUP_ERROR:", error)
    return { message: `Terjadi kesalahan sistem: ${getErrorMessage(error)}` }
  }
}
