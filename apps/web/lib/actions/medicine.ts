"use server"

import { auth } from "@/auth"
import { getOrganizationPlan } from "@/lib/organization-plan"
import { db, medicines } from "@workspace/database"
import { eq, and, count, ilike, or, type SQL } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const medicineSchema = z.object({
  name: z.string().min(2, { message: "Nama obat minimal 2 karakter" }),
  categoryId: z.string().uuid({ message: "Kategori tidak valid" }),
  sku: z.string().optional(),
  purchasePrice: z.string().min(1, { message: "Harga beli harus diisi" }),
  price: z.string().min(1, { message: "Harga jual harus diisi" }),
  stock: z.string().min(1, { message: "Stok harus diisi" }),
  minStock: z.string().min(1, { message: "Stok minimum harus diisi" }),
  unit: z.string().min(1, { message: "Satuan harus diisi" }),
  expiryDate: z.string().optional().nullable(),
})

export async function getMedicines(page = 1, limit = 10, search = "", categoryId = "") {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("Unauthorized")
  }

  const offset = (page - 1) * limit
  
  const filters: (SQL | undefined)[] = [eq(medicines.organizationId, organizationId)]
  
  if (search) {
    filters.push(or(
      ilike(medicines.name, `%${search}%`),
      ilike(medicines.sku, `%${search}%`)
    ))
  }
  
  if (categoryId && categoryId !== "all") {
    filters.push(eq(medicines.categoryId, categoryId))
  }

  const whereClause = and(...filters)

  try {
    const data = await db.query.medicines.findMany({
      where: whereClause,
      with: {
        category: true,
      },
      limit,
      offset,
      orderBy: (medicines, { desc }) => [desc(medicines.createdAt)],
    })

    const countResult = await db
      .select({ value: count() })
      .from(medicines)
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
    console.error("GET_MEDICINES_ERROR:", error)
    return { data: [], metadata: { total: 0, page: 1, limit: 10, totalPages: 0 } }
  }
}

export async function createMedicineAction(prevState: any, formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { message: "Unauthorized" }
  }

  const plan = await getOrganizationPlan(organizationId)

  // SaaS Guardrail: Check limit for 'gratis' plan (Architecture Sec 2.A)
  if (plan === "gratis") {
    const countResult = await db
      .select({ value: count() })
      .from(medicines)
      .where(eq(medicines.organizationId, organizationId))

    const currentCount = countResult[0]?.value ?? 0

    if (currentCount >= 100) {
      return {
        message: "Limit tercapai. Paket Gratis maksimal 100 item obat. Silakan upgrade ke Pro!",
      }
    }
  }

  const validatedFields = medicineSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal menambah obat. Mohon periksa input Anda.",
    }
  }

  try {
    await db.insert(medicines).values({
      ...validatedFields.data,
      organizationId,
      expiryDate: validatedFields.data.expiryDate 
        ? new Date(validatedFields.data.expiryDate) 
        : null,
    })

    revalidatePath("/dashboard/medicines")
    return { message: "Data obat berhasil ditambahkan!", success: true }
  } catch (error: any) {
    console.error("CREATE_MEDICINE_ERROR:", error)
    return { message: `Terjadi kesalahan sistem: ${error.message}` }
  }
}

export async function updateMedicineAction(
  id: string,
  prevState: any,
  formData: FormData
) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { message: "Unauthorized" }
  }

  const validatedFields = medicineSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal memperbarui data. Mohon periksa input Anda.",
    }
  }

  try {
    const [updated] = await db
      .update(medicines)
      .set({
        ...validatedFields.data,
        expiryDate: validatedFields.data.expiryDate 
          ? new Date(validatedFields.data.expiryDate) 
          : null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(medicines.id, id), eq(medicines.organizationId, organizationId))
      )
      .returning()

    if (!updated) {
      return { message: "Data tidak ditemukan atau akses ditolak." }
    }

    revalidatePath("/dashboard/medicines")
    return { message: "Data obat berhasil diperbarui!", success: true }
  } catch (error: any) {
    console.error("UPDATE_MEDICINE_ERROR:", error)
    return { message: `Terjadi kesalahan sistem: ${error.message}` }
  }
}

export async function deleteMedicineAction(id: string) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  const role = session?.user?.role

  if (!organizationId) {
    return { message: "Unauthorized" }
  }

  // RBAC Check: Only admin can delete
  if (role !== "admin") {
    return { message: "Akses ditolak. Hanya Admin yang dapat menghapus data obat." }
  }

  try {
    const [deleted] = await db
      .delete(medicines)
      .where(
        and(eq(medicines.id, id), eq(medicines.organizationId, organizationId))
      )
      .returning()

    if (!deleted) {
      return { message: "Data tidak ditemukan atau akses ditolak." }
    }

    revalidatePath("/dashboard/medicines")
    return { message: "Data obat berhasil dihapus!", success: true }
  } catch (error: any) {
    console.error("DELETE_MEDICINE_ERROR:", error)
    return { message: `Terjadi kesalahan sistem: ${error.message}` }
  }
}
