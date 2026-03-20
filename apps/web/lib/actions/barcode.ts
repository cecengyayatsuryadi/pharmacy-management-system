"use server"

import { db, medicines } from "@workspace/database"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getAuthenticatedSession, handleActionError, type ActionResponse } from "@/lib/utils/action-utils"

const barcodeSchema = z.object({
  medicineId: z.string().uuid("Obat tidak valid"),
  sku: z.string().min(1, "Barcode/SKU tidak boleh kosong"),
})

const REVALIDATE_PATH = "/dashboard/inventory/master/barcodes"

/**
 * Updates the SKU (barcode) of a specific medicine.
 * 
 * @param _prevState - Previous form state
 * @param formData - Form data containing medicineId and sku
 */
export async function updateBarcodeAction(_prevState: any, formData: FormData): Promise<ActionResponse> {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) return { success: false, message: "Unauthorized" }
    const { organizationId } = authData

    const validatedFields = barcodeSchema.safeParse({
      medicineId: formData.get("medicineId"),
      sku: formData.get("sku"),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Gagal memperbarui barcode. Mohon periksa input Anda.",
      }
    }

    const { medicineId, sku } = validatedFields.data

    const [updated] = await db
      .update(medicines)
      .set({
        sku: sku.trim(),
        updatedAt: new Date(),
      })
      .where(and(eq(medicines.id, medicineId), eq(medicines.organizationId, organizationId)))
      .returning()

    if (!updated) {
      return { success: false, message: "Obat tidak ditemukan atau akses ditolak." }
    }

    revalidatePath(REVALIDATE_PATH)
    revalidatePath("/dashboard/inventory/master/medicines")
    
    return { 
      success: true, 
      message: `Barcode untuk ${updated.name} berhasil diperbarui!` 
    }
  } catch (error) {
    return handleActionError(error, "UPDATE_BARCODE")
  }
}

/**
 * Removes the SKU (barcode) from a specific medicine.
 * 
 * @param medicineId - UUID of the medicine
 */
export async function deleteBarcodeAction(medicineId: string): Promise<ActionResponse> {
  try {
    const authData = await getAuthenticatedSession()
    if (!authData) return { success: false, message: "Unauthorized" }
    const { organizationId } = authData

    const [updated] = await db
      .update(medicines)
      .set({
        sku: null,
        updatedAt: new Date(),
      })
      .where(and(eq(medicines.id, medicineId), eq(medicines.organizationId, organizationId)))
      .returning()

    if (!updated) {
      return { success: false, message: "Obat tidak ditemukan atau akses ditolak." }
    }

    revalidatePath(REVALIDATE_PATH)
    revalidatePath("/dashboard/inventory/master/medicines")
    
    return { 
      success: true, 
      message: `Barcode untuk ${updated.name} berhasil dihapus.` 
    }
  } catch (error) {
    return handleActionError(error, "DELETE_BARCODE")
  }
}
