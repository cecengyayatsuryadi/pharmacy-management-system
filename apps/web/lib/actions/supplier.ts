"use server"

import { auth } from "@/auth"
import { db, organizations, suppliers } from "@workspace/database"
import { and, count, desc, eq, ilike, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getErrorMessage } from "@/lib/utils/error"

const supplierSchema = z.object({
  name: z.string().min(2, { message: "Nama supplier minimal 2 karakter" }),
  description: z.string().optional(),
  phone: z.string().optional(),
  contactPerson: z.string().optional(),
  leadTimeDays: z.coerce
    .number()
    .int({ message: "Lead time harus angka bulat" })
    .min(0, { message: "Lead time minimal 0 hari" }),
  isActive: z.preprocess((v) => v === "true" || v === true, z.boolean()),
})

function nextSupplierCodeFrom(lastCode?: string | null) {
  const current = Number(lastCode?.replace(/^SUP-/, "") || "0")
  return `SUP-${String(current + 1).padStart(4, "0")}`
}

export async function getSuppliers(page = 1, limit = 10, search = "") {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) throw new Error("Unauthorized")

  const offset = (page - 1) * limit
  const whereClause = and(
    eq(suppliers.organizationId, organizationId),
    search
      ? or(
          ilike(suppliers.name, `%${search}%`),
          ilike(suppliers.code, `%${search}%`),
          ilike(suppliers.contactPerson, `%${search}%`),
          ilike(suppliers.phone, `%${search}%`)
        )
      : undefined
  )

  try {
    const data = await db.query.suppliers.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (suppliers, { desc }) => [desc(suppliers.createdAt)],
    })

    const countResult = await db.select({ value: count() }).from(suppliers).where(whereClause)
    const total = countResult[0]?.value ?? 0

    return {
      data,
      metadata: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  } catch (error) {
    console.error("GET_SUPPLIERS_ERROR:", error)
    return { data: [], metadata: { total: 0, page: 1, limit: 10, totalPages: 0 } }
  }
}

export async function createSupplierAction(_prevState: unknown, formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  if (!organizationId) return { message: "Unauthorized" }

  const validatedFields = supplierSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal membuat supplier. Mohon periksa input Anda.",
    }
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .for("update")

      const [lastSupplier] = await tx
        .select({ code: suppliers.code })
        .from(suppliers)
        .where(eq(suppliers.organizationId, organizationId))
        .orderBy(desc(suppliers.code))
        .limit(1)

      const nextCode = nextSupplierCodeFrom(lastSupplier?.code)

      await tx.insert(suppliers).values({
        code: nextCode,
        name: validatedFields.data.name,
        description: validatedFields.data.description,
        phone: validatedFields.data.phone,
        contactPerson: validatedFields.data.contactPerson,
        leadTimeDays: validatedFields.data.leadTimeDays,
        isActive: validatedFields.data.isActive,
        organizationId,
      })
    })

    revalidatePath("/dashboard/suppliers")
    return { message: "Supplier berhasil dibuat!", success: true }
  } catch (error: unknown) {
    console.error("CREATE_SUPPLIER_ERROR:", error)
    return { message: `Terjadi kesalahan sistem: ${getErrorMessage(error)}` }
  }
}

export async function updateSupplierAction(id: string, _prevState: unknown, formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  if (!organizationId) return { message: "Unauthorized" }

  const validatedFields = supplierSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal memperbarui supplier. Mohon periksa input Anda.",
    }
  }

  try {
    const [updated] = await db
      .update(suppliers)
      .set({
        name: validatedFields.data.name,
        description: validatedFields.data.description,
        phone: validatedFields.data.phone,
        contactPerson: validatedFields.data.contactPerson,
        leadTimeDays: validatedFields.data.leadTimeDays,
        isActive: validatedFields.data.isActive,
        updatedAt: new Date(),
      })
      .where(and(eq(suppliers.id, id), eq(suppliers.organizationId, organizationId)))
      .returning()

    if (!updated) return { message: "Supplier tidak ditemukan atau akses ditolak." }

    revalidatePath("/dashboard/suppliers")
    return { message: "Supplier berhasil diperbarui!", success: true }
  } catch (error: unknown) {
    console.error("UPDATE_SUPPLIER_ERROR:", error)
    return { message: `Terjadi kesalahan sistem: ${getErrorMessage(error)}` }
  }
}

export async function deleteSupplierAction(id: string) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  if (!organizationId) return { message: "Unauthorized" }

  try {
    const [deleted] = await db
      .delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.organizationId, organizationId)))
      .returning()

    if (!deleted) return { message: "Supplier tidak ditemukan atau akses ditolak." }

    revalidatePath("/dashboard/suppliers")
    return { message: "Supplier berhasil dihapus!", success: true }
  } catch (error: unknown) {
    console.error("DELETE_SUPPLIER_ERROR:", error)
    return { message: `Terjadi kesalahan sistem: ${getErrorMessage(error)}` }
  }
}
