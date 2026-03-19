"use server"

import { auth } from "@/auth"
import { db, units } from "@workspace/database"
import { and, eq, ilike, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getErrorMessage } from "@/lib/utils/error"

const unitSchema = z.object({
  name: z.string().min(1, "Nama satuan wajib diisi"),
  abbreviation: z.string().min(1, "Singkatan wajib diisi"),
})

export async function getUnitsAction(page: number = 1, limit: number = 10, search: string = "") {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("Unauthorized")
  }

  const offset = (page - 1) * limit

  const whereClause = and(
    eq(units.organizationId, organizationId),
    search ? ilike(units.name, `%${search}%`) : undefined
  )

  const [data, totalCount] = await Promise.all([
    db.query.units.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (units, { asc }) => [asc(units.name)],
    }),
    db.select({ count: count() }).from(units).where(whereClause)
  ])

  const total = totalCount[0]?.count ?? 0

  return {
    data,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function createUnitAction(_prevState: any, formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { message: "Unauthorized" }
  }

  const validatedFields = unitSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal membuat satuan. Mohon periksa input Anda.",
    }
  }

  try {
    await db.insert(units).values({
      organizationId,
      ...validatedFields.data,
    })

    revalidatePath("/dashboard/inventory/master/units")
    return { success: true, message: "Satuan berhasil dibuat" }
  } catch (error) {
    return { message: getErrorMessage(error) }
  }
}

export async function updateUnitAction(id: string, _prevState: any, formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { message: "Unauthorized" }
  }

  const validatedFields = unitSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal memperbarui satuan. Mohon periksa input Anda.",
    }
  }

  try {
    await db
      .update(units)
      .set({
        ...validatedFields.data,
      })
      .where(and(eq(units.id, id), eq(units.organizationId, organizationId)))

    revalidatePath("/dashboard/inventory/master/units")
    return { success: true, message: "Satuan berhasil diperbarui" }
  } catch (error) {
    return { message: getErrorMessage(error) }
  }
}

export async function deleteUnitAction(id: string) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    await db
      .delete(units)
      .where(and(eq(units.id, id), eq(units.organizationId, organizationId)))

    revalidatePath("/dashboard/inventory/master/units")
    return { success: true, message: "Satuan berhasil dihapus" }
  } catch (error) {
    return { success: false, message: getErrorMessage(error) }
  }
}
