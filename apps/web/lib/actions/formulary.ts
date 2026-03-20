"use server"

import { db, medicineFormularies, medicineSubstitutions, medicines } from "@workspace/database"
import { eq, and, count, ilike, or, type SQL, desc, inArray } from "drizzle-orm"
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

export async function getFormulariesAction(page = 1, limit = 10, search = "", typeFilter = "") {
  try {
    const { organizationId } = await getAuthenticatedSession()
    const offset = (page - 1) * limit
    const filters: (SQL | undefined)[] = [eq(medicineFormularies.organizationId, organizationId)]

    if (search) {
      const medicineSearch = await db.query.medicines.findMany({
        where: and(
          eq(medicines.organizationId, organizationId),
          ilike(medicines.name, `%${search}%`)
        ),
        columns: { id: true }
      })
      const medicineIds = medicineSearch.map(m => m.id)
      if (medicineIds.length > 0) {
        filters.push(inArray(medicineFormularies.medicineId, medicineIds))
      } else {
        // Return empty if search term doesn't match any medicine
        return { data: [], metadata: { total: 0, page, limit, totalPages: 0 } }
      }
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

export async function upsertFormularyAction(_prevState: any, formData: FormData): Promise<ActionResponse> {
  try {
    const { organizationId } = await getAuthenticatedSession()

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

export async function deleteFormularyAction(id: string): Promise<ActionResponse> {
  try {
    const { organizationId } = await getAuthenticatedSession()

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

export async function getSubstitutionsAction(page = 1, limit = 10, search = "", medicineId = "") {
  try {
    const { organizationId } = await getAuthenticatedSession()
    const offset = (page - 1) * limit
    const filters: (SQL | undefined)[] = [eq(medicineSubstitutions.organizationId, organizationId)]

    if (search) {
      const medicineSearch = await db.query.medicines.findMany({
        where: and(
          eq(medicines.organizationId, organizationId),
          ilike(medicines.name, `%${search}%`)
        ),
        columns: { id: true }
      })
      const medicineIds = medicineSearch.map(m => m.id)
      if (medicineIds.length > 0) {
        filters.push(or(
          inArray(medicineSubstitutions.medicineId, medicineIds),
          inArray(medicineSubstitutions.substituteMedicineId, medicineIds)
        ))
      } else {
        return { data: [], metadata: { total: 0, page, limit, totalPages: 0 } }
      }
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

export async function createSubstitutionAction(_prevState: any, formData: FormData): Promise<ActionResponse> {
  try {
    const { organizationId } = await getAuthenticatedSession()

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

export async function deleteSubstitutionAction(id: string): Promise<ActionResponse> {
  try {
    const { organizationId } = await getAuthenticatedSession()

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
