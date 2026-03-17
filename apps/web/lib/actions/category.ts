"use server"

import { auth } from "@/auth"
import { db, categories } from "@workspace/database"
import { eq, and, count, ilike } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getErrorMessage } from "@/lib/utils/error"

const categorySchema = z.object({
  name: z.string().min(2, { message: "Nama kategori minimal 2 karakter" }),
  description: z.string().optional(),
})

export async function getCategories(page = 1, limit = 10, search = "") {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("Unauthorized")
  }

  const offset = (page - 1) * limit
  const whereClause = and(
    eq(categories.organizationId, organizationId),
    search ? ilike(categories.name, `%${search}%`) : undefined
  )

  try {
    const data = await db.query.categories.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (categories, { desc }) => [desc(categories.createdAt)],
    })

    const countResult = await db
      .select({ value: count() })
      .from(categories)
      .where(whereClause)

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

export async function createCategoryAction(prevState: any, formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { message: "Unauthorized" }
  }

  const validatedFields = categorySchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal membuat kategori. Mohon periksa input Anda.",
    }
  }

  try {
    await db.insert(categories).values({
      name: validatedFields.data.name,
      description: validatedFields.data.description,
      organizationId,
    })

    revalidatePath("/dashboard/categories")
    return { message: "Kategori berhasil dibuat!", success: true }
  } catch (error: unknown) {
    console.error("CREATE_CATEGORY_ERROR:", error)
    return { message: `Terjadi kesalahan sistem: ${getErrorMessage(error)}` }
  }
}

export async function updateCategoryAction(
  id: string,
  prevState: any,
  formData: FormData
) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { message: "Unauthorized" }
  }

  const validatedFields = categorySchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal memperbarui kategori. Mohon periksa input Anda.",
    }
  }

  try {
    const [updated] = await db
      .update(categories)
      .set({
        name: validatedFields.data.name,
        description: validatedFields.data.description,
        updatedAt: new Date(),
      })
      .where(
        and(eq(categories.id, id), eq(categories.organizationId, organizationId))
      )
      .returning()

    if (!updated) {
      return { message: "Kategori tidak ditemukan atau akses ditolak." }
    }

    revalidatePath("/dashboard/categories")
    return { message: "Kategori berhasil diperbarui!", success: true }
  } catch (error: unknown) {
    console.error("UPDATE_CATEGORY_ERROR:", error)
    return { message: `Terjadi kesalahan sistem: ${getErrorMessage(error)}` }
  }
}

export async function deleteCategoryAction(id: string) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { message: "Unauthorized" }
  }

  try {
    const [deleted] = await db
      .delete(categories)
      .where(
        and(eq(categories.id, id), eq(categories.organizationId, organizationId))
      )
      .returning()

    if (!deleted) {
      return { message: "Kategori tidak ditemukan atau akses ditolak." }
    }

    revalidatePath("/dashboard/categories")
    return { message: "Kategori berhasil dihapus!", success: true }
  } catch (error: unknown) {
    console.error("DELETE_CATEGORY_ERROR:", error)
    return { message: `Terjadi kesalahan sistem: ${getErrorMessage(error)}` }
  }
}
