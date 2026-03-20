"use server"

import { db, medicineFormularies, medicineSubstitutions, medicines } from "@workspace/database"
import { eq, and, count, ilike, or, type SQL, desc, exists } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getAuthenticatedSession, handleActionError, type ActionResponse } from "@/lib/utils/action-utils"

const formularySchema = z.object({
  medicineId: z.string().uuid("Obat tidak valid"),
  type: z.string().min(1, "Tipe formularium harus diisi"),
  status: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),
  note: z.string().nullish(),
})

const substitutionSchema = z.object({
  medicineId: z.string().uuid("Obat utama tidak valid"),
  substituteMedicineId: z.string().uuid("Obat pengganti tidak valid"),
  note: z.string().nullish(),
})

const REVALIDATE_PATH = "/dashboard/inventory/master/formulary"

/**
 * Fetches a list of medicine formularies.
 * Uses an optimized EXISTS subquery for name-based search.
 * 
 * @param page - Page number
 * @param limit - Page size
 * @param search - Search query for medicine name
 * @param typeFilter - Filter by formulary type (e.g., 'Fornas')
 * @returns Paginated formulary data
 */
export async function getFormulariesAction(page = 1, limit = 10, search = "", typeFilter = "") {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) {
      throw new Error("Unauthorized")
    }
    const { organizationId } = authData
    const offset = (page - 1) * limit
    const filters: (SQL | undefined)[] = [eq(medicineFormularies.organizationId, organizationId)]

    if (search) {
      filters.push(exists(
        db.select({ id: medicines.id })
          .from(medicines)
          .where(and(
            eq(medicines.id, medicineFormularies.medicineId),
            eq(medicines.organizationId, organizationId),
            ilike(medicines.name, `%${search}%`)
          ))
      ))
    }

    if (typeFilter && typeFilter !== "all") {
      filters.push(eq(medicineFormularies.type, typeFilter))
    }

    const whereClause = and(...filters)

    const [data, countResult] = await Promise.all([
      db.query.medicineFormularies.findMany({
        where: whereClause,
        with: {
          medicine: {
            with: {
              group: true
            }
          },
        },
        limit,
        offset,
        orderBy: [desc(medicineFormularies.createdAt)],
      }),
      db.select({ value: count() }).from(medicineFormularies).where(whereClause)
    ])

    const total = countResult[0]?.value ?? 0

    return { 
      data, 
      metadata: { 
        total, 
        page, 
        limit,
        totalPages: Math.ceil(total / limit)
      } 
    }
  } catch (error) {
    console.error("GET_FORMULARIES_ERROR:", error)
    return { data: [], metadata: { total: 0, page: 1, limit: 10, totalPages: 0 } }
  }
}

/**
 * Creates or updates a formulary record.
 * 
 * @param _prevState - Previous state
 * @param formData - FormData with optional 'id' for updates
 * @returns ActionResponse
 */
export async function upsertFormularyAction(_prevState: any, formData: FormData): Promise<ActionResponse> {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) return { success: false, message: "Unauthorized" }
    const { organizationId } = authData

    const validatedFields = formularySchema.safeParse(Object.fromEntries(formData.entries()))
    if (!validatedFields.success) {
      return { 
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Gagal menyimpan formularium. Mohon periksa input Anda."
      }
    }

    const id = formData.get("id") as string | null

    if (id) {
      const [updated] = await db.update(medicineFormularies)
        .set({ ...validatedFields.data, updatedAt: new Date() })
        .where(and(eq(medicineFormularies.id, id), eq(medicineFormularies.organizationId, organizationId)))
        .returning()
      
      if (!updated) {
        return { success: false, message: "Data tidak ditemukan atau akses ditolak." }
      }
    } else {
      await db.insert(medicineFormularies).values({
        ...validatedFields.data,
        organizationId,
      })
    }

    revalidatePath(REVALIDATE_PATH)
    return { success: true, message: id ? "Formularium berhasil diperbarui" : "Formularium berhasil ditambahkan" }
  } catch (error) {
    return handleActionError(error, "UPSERT_FORMULARY")
  }
}

/**
 * Deletes a formulary record.
 * 
 * @param id - Formulary UUID
 * @returns ActionResponse
 */
export async function deleteFormularyAction(id: string): Promise<ActionResponse> {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) return { success: false, message: "Unauthorized" }
    const { organizationId } = authData

    const [deleted] = await db.delete(medicineFormularies)
      .where(and(eq(medicineFormularies.id, id), eq(medicineFormularies.organizationId, organizationId)))
      .returning()

    if (!deleted) {
      return { success: false, message: "Data tidak ditemukan atau akses ditolak." }
    }

    revalidatePath(REVALIDATE_PATH)
    return { success: true, message: "Formularium berhasil dihapus" }
  } catch (error) {
    return handleActionError(error, "DELETE_FORMULARY")
  }
}

/**
 * Fetches substitute medicines for a primary medicine.
 * 
 * @param page - Page number
 * @param limit - Items per page
 * @param search - Search primary or substitute medicine name
 * @param medicineId - Filter by primary medicine UUID
 * @returns List of substitutions
 */
export async function getSubstitutionsAction(page = 1, limit = 10, search = "", medicineId = "") {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) {
      throw new Error("Unauthorized")
    }
    const { organizationId } = authData
    const offset = (page - 1) * limit
    const filters: (SQL | undefined)[] = [eq(medicineSubstitutions.organizationId, organizationId)]

    if (search) {
      // Subquery for search to avoid sequential medicine ID fetching
      filters.push(or(
        exists(
          db.select({ id: medicines.id })
            .from(medicines)
            .where(and(
              eq(medicines.id, medicineSubstitutions.medicineId),
              eq(medicines.organizationId, organizationId),
              ilike(medicines.name, `%${search}%`)
            ))
        ),
        exists(
          db.select({ id: medicines.id })
            .from(medicines)
            .where(and(
              eq(medicines.id, medicineSubstitutions.substituteMedicineId),
              eq(medicines.organizationId, organizationId),
              ilike(medicines.name, `%${search}%`)
            ))
        )
      ))
    }

    if (medicineId) {
      filters.push(eq(medicineSubstitutions.medicineId, medicineId))
    }

    const whereClause = and(...filters)

    const [data, countResult] = await Promise.all([
      db.query.medicineSubstitutions.findMany({
        where: whereClause,
        with: {
          medicine: {
            with: {
              group: true
            }
          },
          substituteMedicine: {
            with: {
              group: true
            }
          },
        },
        limit,
        offset,
        orderBy: [desc(medicineSubstitutions.createdAt)],
      }),
      db.select({ value: count() }).from(medicineSubstitutions).where(whereClause)
    ])

    const total = countResult[0]?.value ?? 0

    return { 
      data, 
      metadata: { 
        total, 
        page, 
        limit,
        totalPages: Math.ceil(total / limit)
      } 
    }
  } catch (error) {
    console.error("GET_SUBSTITUTIONS_ERROR:", error)
    return { data: [], metadata: { total: 0, page: 1, limit: 10, totalPages: 0 } }
  }
}

/**
 * Creates a new medicine substitution link.
 * 
 * @param _prevState - Previous state
 * @param formData - FormData containing medicineId and substituteMedicineId
 * @returns ActionResponse
 */
export async function createSubstitutionAction(_prevState: any, formData: FormData): Promise<ActionResponse> {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) return { success: false, message: "Unauthorized" }
    const { organizationId } = authData

    const validatedFields = substitutionSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!validatedFields.success) {
      return { 
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Gagal menyimpan substitusi. Mohon periksa input Anda."
      }
    }

    if (validatedFields.data.medicineId === validatedFields.data.substituteMedicineId) {
      return { success: false, message: "Obat tidak bisa mensubstitusi dirinya sendiri" }
    }

    await db.insert(medicineSubstitutions).values({
      ...validatedFields.data,
      organizationId,
    })

    revalidatePath(REVALIDATE_PATH)
    return { success: true, message: "Substitusi berhasil ditambahkan" }
  } catch (error) {
    return handleActionError(error, "CREATE_SUBSTITUTION")
  }
}

/**
 * Deletes a substitution link.
 * 
 * @param id - Substitution UUID
 * @returns ActionResponse
 */
export async function deleteSubstitutionAction(id: string): Promise<ActionResponse> {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) return { success: false, message: "Unauthorized" }
    const { organizationId } = authData

    const [deleted] = await db.delete(medicineSubstitutions)
      .where(and(eq(medicineSubstitutions.id, id), eq(medicineSubstitutions.organizationId, organizationId)))
      .returning()

    if (!deleted) {
      return { success: false, message: "Data tidak ditemukan atau akses ditolak." }
    }

    revalidatePath(REVALIDATE_PATH)
    return { success: true, message: "Substitusi berhasil dihapus" }
  } catch (error) {
    return handleActionError(error, "DELETE_SUBSTITUTION")
  }
}
