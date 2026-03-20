"use server"

import { db, categories, medicines } from "@workspace/database"
import { eq, and, count, ilike, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getAuthenticatedSession, handleActionError, type ActionResponse } from "@/lib/utils/action-utils"

const categorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter"),
  color: z.string().min(4, "Warna tidak valid"),
  description: z.string().nullish(),
})

const REVALIDATE_PATH = "/dashboard/inventory/master/categories"

export async function getCategories(page = 1, limit = 10, search = "") {
  try {
    const { organizationId } = await getAuthenticatedSession()
    const offset = (page - 1) * limit
    const whereClause = eq(categories.organizationId, organizationId)
    const searchFilter = search ? ilike(categories.name, `%${search}%`) : undefined

    const [data, countResult] = await Promise.all([
      db
        .select({
          id: categories.id,
          organizationId: categories.organizationId,
          name: categories.name,
          color: categories.color,
          description: categories.description,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
          medicinesCount: count(medicines.id),
        })
        .from(categories)
        .leftJoin(medicines, eq(medicines.categoryId, categories.id))
        .where(and(whereClause, searchFilter))
        .groupBy(categories.id)
        .limit(limit)
        .offset(offset)
        .orderBy(sql`${categories.createdAt} DESC`),
      db
        .select({ value: count() })
        .from(categories)
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
    console.error("GET_CATEGORIES_ERROR:", error)
    return { data: [], metadata: { total: 0, page: 1, limit: 10, totalPages: 0 } }
  }
}

export async function createCategoryAction(_prevState: any, formData: FormData): Promise<ActionResponse> {
  try {
    const { organizationId } = await getAuthenticatedSession()

    const validatedFields = categorySchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Gagal membuat kategori. Mohon periksa input Anda.",
      }
    }

    await db.insert(categories).values({
      ...validatedFields.data,
      organizationId,
    })

    revalidatePath(REVALIDATE_PATH)
    return { success: true, message: "Kategori berhasil dibuat!" }
  } catch (error) {
    return handleActionError(error, "CREATE_CATEGORY")
  }
}

export async function updateCategoryAction(id: string, _prevState: any, formData: FormData): Promise<ActionResponse> {
  try {
    const { organizationId } = await getAuthenticatedSession()

    const validatedFields = categorySchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Gagal memperbarui kategori. Mohon periksa input Anda.",
      }
    }

    const [updated] = await db
      .update(categories)
      .set({
        ...validatedFields.data,
        updatedAt: new Date(),
      })
      .where(and(eq(categories.id, id), eq(categories.organizationId, organizationId)))
      .returning()

    if (!updated) {
      return { success: false, message: "Kategori tidak ditemukan atau akses ditolak." }
    }

    revalidatePath(REVALIDATE_PATH)
    return { success: true, message: "Kategori berhasil diperbarui!" }
  } catch (error) {
    return handleActionError(error, "UPDATE_CATEGORY")
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResponse> {
  try {
    const { organizationId } = await getAuthenticatedSession()

    const products = await db
      .select({ value: count() })
      .from(medicines)
      .where(and(eq(medicines.categoryId, id), eq(medicines.organizationId, organizationId)))

    if ((products[0]?.value ?? 0) > 0) {
      return { 
        success: false,
        message: `Gagal menghapus! Masih ada ${products[0]?.value} produk yang menggunakan kategori ini.`, 
      }
    }

    const [deleted] = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.organizationId, organizationId)))
      .returning()

    if (!deleted) {
      return { success: false, message: "Kategori tidak ditemukan atau akses ditolak." }
    }

    revalidatePath(REVALIDATE_PATH)
    return { success: true, message: "Kategori berhasil dihapus!" }
  } catch (error) {
    return handleActionError(error, "DELETE_CATEGORY")
  }
}
