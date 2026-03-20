"use server"

import { db, medicineGroups, medicines } from "@workspace/database"
import { eq, and, count, ilike, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getAuthenticatedSession, handleActionError, type ActionResponse } from "@/lib/utils/action-utils"

const medicineGroupSchema = z.object({
  name: z.string().min(2, "Nama golongan minimal 2 karakter"),
  color: z.string().startsWith("#", "Warna harus berupa kode hex (misal: #3b82f6)"),
  description: z.string().nullish(),
})

const REVALIDATE_PATH = "/dashboard/inventory/master/categories"

/**
 * Fetches a list of medicine groups (therapeutic groups) for the organization.
 * 
 * @param page - Page number
 * @param limit - Page size
 * @param search - Filter by group name
 * @returns List of groups and metadata
 */
export async function getMedicineGroups(page = 1, limit = 10, search = "") {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) {
      throw new Error("Unauthorized")
    }
    const { organizationId } = authData
    const offset = (page - 1) * limit
    const whereClause = eq(medicineGroups.organizationId, organizationId)
    const searchFilter = search ? ilike(medicineGroups.name, `%${search}%`) : undefined

    const [data, countResult] = await Promise.all([
      db
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
        .where(and(whereClause, searchFilter))
        .groupBy(medicineGroups.id)
        .limit(limit)
        .offset(offset)
        .orderBy(sql`${medicineGroups.createdAt} DESC`),
      db
        .select({ value: count() })
        .from(medicineGroups)
        .where(and(whereClause, searchFilter))
    ])

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

/**
 * Creates a new medicine group.
 * 
 * @param _prevState - Previous state
 * @param formData - FormData
 * @returns ActionResponse
 */
export async function createMedicineGroupAction(_prevState: any, formData: FormData): Promise<ActionResponse> {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) return { success: false, message: "Unauthorized" }
    const { organizationId } = authData

    const validatedFields = medicineGroupSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Gagal membuat golongan. Mohon periksa input Anda.",
      }
    }

    await db.insert(medicineGroups).values({
      ...validatedFields.data,
      organizationId,
    })

    revalidatePath(REVALIDATE_PATH)
    return { success: true, message: "Golongan berhasil dibuat!" }
  } catch (error) {
    return handleActionError(error, "CREATE_MEDICINE_GROUP")
  }
}

/**
 * Updates an existing medicine group.
 * 
 * @param id - Group UUID
 * @param _prevState - Previous state
 * @param formData - FormData
 * @returns ActionResponse
 */
export async function updateMedicineGroupAction(id: string, _prevState: any, formData: FormData): Promise<ActionResponse> {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) return { success: false, message: "Unauthorized" }
    const { organizationId } = authData

    const validatedFields = medicineGroupSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Gagal memperbarui golongan. Mohon periksa input Anda.",
      }
    }

    const [updated] = await db
      .update(medicineGroups)
      .set({
        ...validatedFields.data,
        updatedAt: new Date(),
      })
      .where(and(eq(medicineGroups.id, id), eq(medicineGroups.organizationId, organizationId)))
      .returning()

    if (!updated) {
      return { success: false, message: "Golongan tidak ditemukan atau akses ditolak." }
    }

    revalidatePath(REVALIDATE_PATH)
    return { success: true, message: "Golongan berhasil diperbarui!" }
  } catch (error) {
    return handleActionError(error, "UPDATE_MEDICINE_GROUP")
  }
}

/**
 * Deletes a medicine group.
 * Fails if the group is still linked to medicines.
 * 
 * @param id - Group UUID
 * @returns ActionResponse
 */
export async function deleteMedicineGroupAction(id: string): Promise<ActionResponse> {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) return { success: false, message: "Unauthorized" }
    const { organizationId } = authData

    const products = await db
      .select({ value: count() })
      .from(medicines)
      .where(and(eq(medicines.groupId, id), eq(medicines.organizationId, organizationId)))

    if ((products[0]?.value ?? 0) > 0) {
      return { 
        success: false,
        message: `Gagal menghapus! Masih ada ${products[0]?.value} produk yang menggunakan golongan ini.`, 
      }
    }

    const [deleted] = await db
      .delete(medicineGroups)
      .where(and(eq(medicineGroups.id, id), eq(medicineGroups.organizationId, organizationId)))
      .returning()

    if (!deleted) {
      return { success: false, message: "Golongan tidak ditemukan atau akses ditolak." }
    }

    revalidatePath(REVALIDATE_PATH)
    return { success: true, message: "Golongan berhasil dihapus!" }
  } catch (error) {
    return handleActionError(error, "DELETE_MEDICINE_GROUP")
  }
}
