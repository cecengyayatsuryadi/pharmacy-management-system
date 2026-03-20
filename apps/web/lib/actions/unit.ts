"use server"

import { db, units } from "@workspace/database"
import { and, eq, ilike, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getAuthenticatedSession, handleActionError, type ActionResponse } from "@/lib/utils/action-utils"

const unitSchema = z.object({
  name: z.string().min(1, "Nama satuan wajib diisi"),
  abbreviation: z.string().min(1, "Singkatan wajib diisi"),
})

const REVALIDATE_PATH = "/dashboard/inventory/master/units"

/**
 * Fetches a list of measurement units for the organization.
 * 
 * @param page - Page number
 * @param limit - Page size
 * @param search - Filter by unit name
 * @returns List of units and metadata
 */
export async function getUnitsAction(page: number = 1, limit: number = 10, search: string = "") {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) {
      throw new Error("Unauthorized")
    }
    const { organizationId } = authData
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
        orderBy: (u, { asc }) => [asc(u.name)],
      }),
      db.select({ value: count() }).from(units).where(whereClause)
    ])

    const total = totalCount[0]?.value ?? 0

    return {
      data,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error("GET_UNITS_ERROR:", error)
    return { data: [], metadata: { total: 0, page: 1, limit: 10, totalPages: 0 } }
  }
}

/**
 * Creates a new unit of measurement.
 * 
 * @param _prevState - Previous state
 * @param formData - FormData
 * @returns ActionResponse
 */
export async function createUnitAction(_prevState: any, formData: FormData): Promise<ActionResponse> {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) return { success: false, message: "Unauthorized" }
    const { organizationId } = authData

    const validatedFields = unitSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Gagal membuat satuan. Mohon periksa input Anda.",
      }
    }

    await db.insert(units).values({
      ...validatedFields.data,
      organizationId,
    })

    revalidatePath(REVALIDATE_PATH)
    return { success: true, message: "Satuan berhasil dibuat" }
  } catch (error) {
    return handleActionError(error, "CREATE_UNIT")
  }
}

/**
 * Updates an existing unit.
 * 
 * @param id - Unit UUID
 * @param _prevState - Previous state
 * @param formData - FormData
 * @returns ActionResponse
 */
export async function updateUnitAction(id: string, _prevState: any, formData: FormData): Promise<ActionResponse> {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) return { success: false, message: "Unauthorized" }
    const { organizationId } = authData

    const validatedFields = unitSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Gagal memperbarui satuan. Mohon periksa input Anda.",
      }
    }

    const [updated] = await db
      .update(units)
      .set({
        ...validatedFields.data,
      })
      .where(and(eq(units.id, id), eq(units.organizationId, organizationId)))
      .returning()

    if (!updated) {
      return { success: false, message: "Satuan tidak ditemukan atau akses ditolak." }
    }

    revalidatePath(REVALIDATE_PATH)
    return { success: true, message: "Satuan berhasil diperbarui" }
  } catch (error) {
    return handleActionError(error, "UPDATE_UNIT")
  }
}

/**
 * Deletes a unit.
 * 
 * @param id - Unit UUID
 * @returns ActionResponse
 */
export async function deleteUnitAction(id: string): Promise<ActionResponse> {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) return { success: false, message: "Unauthorized" }
    const { organizationId } = authData

    const [deleted] = await db
      .delete(units)
      .where(and(eq(units.id, id), eq(units.organizationId, organizationId)))
      .returning()

    if (!deleted) {
      return { success: false, message: "Satuan tidak ditemukan atau akses ditolak." }
    }

    revalidatePath(REVALIDATE_PATH)
    return { success: true, message: "Satuan berhasil dihapus" }
  } catch (error) {
    return handleActionError(error, "DELETE_UNIT")
  }
}
