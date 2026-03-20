"use server"

import { getOrganizationPlan } from "@/lib/organization-plan"
import { db, medicines } from "@workspace/database"
import { eq, and, count, ilike, or, type SQL } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getAuthenticatedSession, handleActionError, type ActionResponse } from "@/lib/utils/action-utils"

/**
 * Validasi schema dengan modern Zod patterns.
 * Menggunakan coerce untuk menangani input dari FormData.
 */
const medicineSchema = z.object({
  name: z.string().min(2, "Nama obat minimal 2 karakter"),
  genericName: z.string().nullish(),
  categoryId: z.string().uuid("Kategori tidak valid"),
  groupId: z.string().uuid("Golongan tidak valid").nullish(),
  baseUnitId: z.string().uuid("Satuan tidak valid"),
  classification: z.string().default("Bebas").nullish(),
  code: z.string().nullish(),
  sku: z.string().nullish(),
  purchasePrice: z.coerce.string().min(1, "Harga beli harus diisi"),
  price: z.coerce.string().min(1, "Harga jual harus diisi"),
  stock: z.coerce.string().min(1, "Stok harus diisi"),
  minStock: z.coerce.string().min(1, "Stok minimum harus diisi"),
  maxStock: z.coerce.string().min(1, "Stok maksimum harus diisi"),
  description: z.string().nullish(),
  isActive: z.preprocess((val) => val === "true", z.boolean()).default(true),
  composition: z.string().nullish(),
  indication: z.string().nullish(),
  contraindication: z.string().nullish(),
  sideEffects: z.string().nullish(),
  manufacturer: z.string().nullish(),
  distributor: z.string().nullish(),
  image: z.string().nullish(),
  expiryDate: z.preprocess((val) => (val ? new Date(val as string) : null), z.date().nullish()),
  unit: z.string().default("pcs").nullish(), // Legacy
})

type MedicineFormValues = z.infer<typeof medicineSchema>

/**
 * Helper untuk transformasi data ke format Database.
 * Menghindari duplikasi logika antara create dan update.
 */
function mapToMedicineRecord(data: MedicineFormValues) {
  return {
    ...data,
    groupId: data.groupId || null,
    classification: data.classification || "Bebas",
    sku: data.sku || null,
    unit: data.unit || "pcs",
    genericName: data.genericName || null,
    description: data.description || null,
    composition: data.composition || null,
    indication: data.indication || null,
    contraindication: data.contraindication || null,
    sideEffects: data.sideEffects || null,
    manufacturer: data.manufacturer || null,
    distributor: data.distributor || null,
    image: data.image || null,
  }
}

const REVALIDATE_PATH = "/dashboard/inventory/master/medicines"

/**
 * Fetches a paginated list of medicines for the authenticated organization.
 * Optimized with selective column loading and composite indexing.
 * 
 * @param page - Current page number (1-based)
 * @param limit - Number of items per page
 * @param search - Search query for name, generic name, SKU, or code
 * @param categoryId - Filter by category UUID
 * @param status - Filter by active status ("active" | "inactive")
 * @param groupId - Filter by medicine group UUID
 * @returns Object containing data array and metadata
 */
export async function getMedicines(
  page = 1, 
  limit = 10, 
  search = "", 
  categoryId = "", 
  status = "", 
  groupId = ""
) {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) {
      throw new Error("Unauthorized")
    }
    const { organizationId } = authData
    const offset = (page - 1) * limit
    
    const filters: (SQL | undefined)[] = [eq(medicines.organizationId, organizationId)]
    
    if (search) {
      filters.push(or(
        ilike(medicines.name, `%${search}%`),
        ilike(medicines.genericName, `%${search}%`),
        ilike(medicines.sku, `%${search}%`),
        ilike(medicines.code, `%${search}%`)
      ))
    }
    
    if (categoryId && categoryId !== "all") {
      filters.push(eq(medicines.categoryId, categoryId))
    }

    if (groupId && groupId !== "all") {
      filters.push(eq(medicines.groupId, groupId))
    }

    if (status === "active") {
      filters.push(eq(medicines.isActive, true))
    } else if (status === "inactive") {
      filters.push(eq(medicines.isActive, false))
    }

    const whereClause = and(...filters)

    const [data, countResult] = await Promise.all([
      db.query.medicines.findMany({
        where: whereClause,
        columns: {
          id: true,
          name: true,
          genericName: true,
          code: true,
          sku: true,
          price: true,
          stock: true,
          minStock: true,
          maxStock: true,
          isActive: true,
          unit: true, // Legacy
          baseUnitId: true,
          categoryId: true,
          groupId: true,
          createdAt: true,
        },
        with: {
          category: {
            columns: {
              id: true,
              name: true,
              color: true,
            }
          },
          group: {
            columns: {
              id: true,
              name: true,
              color: true,
            }
          },
          baseUnit: {
            columns: {
              id: true,
              name: true,
              abbreviation: true,
            }
          },
        },
        limit,
        offset,
        orderBy: (m, { desc }) => [desc(m.createdAt)],
      }),
      db.select({ value: count() }).from(medicines).where(whereClause)
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
    console.error("GET_MEDICINES_ERROR:", error)
    return { data: [], metadata: { total: 0, page: 1, limit: 10, totalPages: 0 } }
  }
}

/**
 * Adds a new medicine record.
 * Includes a business logic check for organization plan limits.
 * Uses a database transaction to ensure atomicity.
 * 
 * @param _prevState - Previous form state (from useFormState)
 * @param formData - Raw form data containing medicine details
 * @returns Standard ActionResponse
 */
export async function createMedicineAction(_prevState: any, formData: FormData): Promise<ActionResponse> {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) return { success: false, message: "Unauthorized" }
    const { organizationId } = authData

    const validatedFields = medicineSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Gagal menambah obat. Mohon periksa input Anda.",
      }
    }

    // Atomic transaction for plan check and insertion
    const result = await db.transaction(async (tx) => {
      const [plan, countResult] = await Promise.all([
        getOrganizationPlan(organizationId),
        tx.select({ value: count() }).from(medicines).where(eq(medicines.organizationId, organizationId))
      ])
      
      const currentCount = countResult[0]?.value ?? 0

      if (plan === "gratis" && currentCount >= 100) {
        return {
          success: false,
          message: "Limit tercapai. Paket Gratis maksimal 100 item obat. Silakan upgrade ke Pro!",
        }
      }

      // Auto-generate Code if not provided
      let finalCode = validatedFields.data.code
      if (!finalCode) {
        finalCode = `MED-${(currentCount + 1).toString().padStart(5, '0')}`
      }

      await tx.insert(medicines).values({
        ...mapToMedicineRecord(validatedFields.data),
        organizationId,
        code: finalCode,
      })

      return { success: true, message: "Data obat berhasil ditambahkan!" }
    })

    if (result.success) {
      revalidatePath(REVALIDATE_PATH)
    }
    
    return result
  } catch (error) {
    return handleActionError(error, "CREATE_MEDICINE")
  }
}

/**
 * Updates an existing medicine record.
 * 
 * @param id - UUID of the medicine to update
 * @param _prevState - Previous form state
 * @param formData - Raw form data
 * @returns Standard ActionResponse
 */
export async function updateMedicineAction(id: string, _prevState: any, formData: FormData): Promise<ActionResponse> {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) return { success: false, message: "Unauthorized" }
    const { organizationId } = authData

    const validatedFields = medicineSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Gagal memperbarui data. Mohon periksa input Anda.",
      }
    }

    const { code, ...restOfData } = validatedFields.data
    
    const updateData: any = {
      ...mapToMedicineRecord(restOfData as MedicineFormValues),
      updatedAt: new Date(),
    }

    if (code) {
      updateData.code = code
    }
    
    const [updated] = await db
      .update(medicines)
      .set(updateData)
      .where(and(eq(medicines.id, id), eq(medicines.organizationId, organizationId)))
      .returning()

    if (!updated) {
      return { success: false, message: "Data tidak ditemukan atau akses ditolak." }
    }

    revalidatePath(REVALIDATE_PATH)
    return { success: true, message: "Data obat berhasil diperbarui!" }
  } catch (error) {
    return handleActionError(error, "UPDATE_MEDICINE")
  }
}

/**
 * Deletes a medicine record.
 * Strictly restricted to users with 'admin' role.
 * 
 * @param id - UUID of the medicine to delete
 * @returns Standard ActionResponse
 */
export async function deleteMedicineAction(id: string): Promise<ActionResponse> {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) return { success: false, message: "Unauthorized" }
    const { organizationId, role } = authData

    if (role !== "admin") {
      return { success: false, message: "Akses ditolak. Hanya Admin yang dapat menghapus data obat." }
    }

    const [deleted] = await db
      .delete(medicines)
      .where(and(eq(medicines.id, id), eq(medicines.organizationId, organizationId)))
      .returning()

    if (!deleted) {
      return { success: false, message: "Data tidak ditemukan atau akses ditolak." }
    }

    revalidatePath(REVALIDATE_PATH)
    return { success: true, message: "Data obat berhasil dihapus!" }
  } catch (error) {
    return handleActionError(error, "DELETE_MEDICINE")
  }
}
