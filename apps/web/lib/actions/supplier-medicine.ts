"use server"

import { auth } from "@/auth"
import { db, medicines, supplierMedicines, suppliers } from "@workspace/database"
import { and, count, desc, eq, ilike, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getErrorMessage } from "@/lib/utils/error"

const supplierMedicineSchema = z.object({
  supplierId: z.string().uuid({ message: "Supplier tidak valid" }),
  medicineId: z.string().uuid({ message: "Obat tidak valid" }),
  supplierSku: z.string().optional(),
  lastPurchasePrice: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().finite().nonnegative({ message: "Harga beli terakhir tidak valid" }).optional()
  ),
  leadTimeDays: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int({ message: "Lead time harus angka bulat" }).min(0).optional()
  ),
  isPrimary: z.preprocess((v) => v === "true" || v === true, z.boolean()).optional().default(false),
  isActive: z.preprocess((v) => v === "true" || v === true, z.boolean()).optional().default(true),
  note: z.string().optional(),
})

export async function getSupplierMedicines(page = 1, limit = 10, search = "") {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("Unauthorized")
  }
  const offset = (page - 1) * limit

  const whereClause = and(
    eq(supplierMedicines.organizationId, organizationId),
    search
      ? or(
          ilike(suppliers.name, `%${search}%`),
          ilike(suppliers.code, `%${search}%`),
          ilike(medicines.name, `%${search}%`),
          ilike(medicines.sku, `%${search}%`),
          ilike(supplierMedicines.supplierSku, `%${search}%`)
        )
      : undefined
  )

  const data = await db
    .select({
      id: supplierMedicines.id,
      supplierId: supplierMedicines.supplierId,
      medicineId: supplierMedicines.medicineId,
      supplierSku: supplierMedicines.supplierSku,
      lastPurchasePrice: supplierMedicines.lastPurchasePrice,
      leadTimeDays: supplierMedicines.leadTimeDays,
      isPrimary: supplierMedicines.isPrimary,
      isActive: supplierMedicines.isActive,
      note: supplierMedicines.note,
      updatedAt: supplierMedicines.updatedAt,
      supplier: {
        id: suppliers.id,
        name: suppliers.name,
        code: suppliers.code,
      },
      medicine: {
        id: medicines.id,
        name: medicines.name,
        sku: medicines.sku,
        unit: medicines.unit,
      },
    })
    .from(supplierMedicines)
    .innerJoin(suppliers, eq(supplierMedicines.supplierId, suppliers.id))
    .innerJoin(medicines, eq(supplierMedicines.medicineId, medicines.id))
    .where(whereClause)
    .orderBy(desc(supplierMedicines.updatedAt))
    .limit(limit)
    .offset(offset)

  const countResult = await db
    .select({ value: count() })
    .from(supplierMedicines)
    .innerJoin(suppliers, eq(supplierMedicines.supplierId, suppliers.id))
    .innerJoin(medicines, eq(supplierMedicines.medicineId, medicines.id))
    .where(whereClause)

  const total = Number(countResult[0]?.value ?? 0)

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

export async function upsertSupplierMedicineAction(_prevState: unknown, formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { message: "Unauthorized" }
  }

  const validatedFields = supplierMedicineSchema.safeParse(Object.fromEntries(formData.entries()))

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal menyimpan relasi supplier-obat. Mohon periksa input Anda.",
    }
  }

  const {
    supplierId,
    medicineId,
    supplierSku,
    lastPurchasePrice,
    leadTimeDays,
    isPrimary,
    isActive,
    note,
  } = validatedFields.data

  try {
    await db.transaction(async (tx) => {
      const [supplier] = await tx
        .select({ id: suppliers.id })
        .from(suppliers)
        .where(and(eq(suppliers.id, supplierId), eq(suppliers.organizationId, organizationId)))

      if (!supplier) {
        throw new Error("Supplier tidak ditemukan")
      }

      const [medicine] = await tx
        .select({ id: medicines.id })
        .from(medicines)
        .where(and(eq(medicines.id, medicineId), eq(medicines.organizationId, organizationId)))

      if (!medicine) {
        throw new Error("Obat tidak ditemukan")
      }

      if (isPrimary) {
        await tx
          .update(supplierMedicines)
          .set({ isPrimary: false, updatedAt: new Date() })
          .where(
            and(
              eq(supplierMedicines.organizationId, organizationId),
              eq(supplierMedicines.medicineId, medicineId)
            )
          )
      }

      await tx
        .insert(supplierMedicines)
        .values({
          organizationId,
          supplierId,
          medicineId,
          supplierSku: supplierSku?.trim() || null,
          lastPurchasePrice:
            typeof lastPurchasePrice === "number" ? lastPurchasePrice.toFixed(2) : null,
          leadTimeDays,
          isPrimary,
          isActive,
          note,
        })
        .onConflictDoUpdate({
          target: [
            supplierMedicines.organizationId,
            supplierMedicines.supplierId,
            supplierMedicines.medicineId,
          ],
          set: {
            supplierSku: supplierSku?.trim() || null,
            lastPurchasePrice:
              typeof lastPurchasePrice === "number" ? lastPurchasePrice.toFixed(2) : null,
            leadTimeDays,
            isPrimary,
            isActive,
            note,
            updatedAt: new Date(),
          },
        })
    })

    revalidatePath("/dashboard/procurement")
    revalidatePath("/dashboard/procurement/purchases")
    revalidatePath("/dashboard/suppliers")
    revalidatePath("/dashboard/medicines")

    return {
      success: true,
      message: "Relasi supplier-obat berhasil disimpan",
    }
  } catch (error: unknown) {
    console.error("UPSERT_SUPPLIER_MEDICINE_ERROR:", error)
    return { message: getErrorMessage(error) }
  }
}

export async function deleteSupplierMedicineAction(id: string) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { message: "Unauthorized" }
  }

  try {
    const [deleted] = await db
      .delete(supplierMedicines)
      .where(and(eq(supplierMedicines.id, id), eq(supplierMedicines.organizationId, organizationId)))
      .returning({ id: supplierMedicines.id })

    if (!deleted) {
      return { message: "Relasi tidak ditemukan atau akses ditolak" }
    }

    revalidatePath("/dashboard/procurement")
    revalidatePath("/dashboard/procurement/purchases")
    revalidatePath("/dashboard/suppliers")
    revalidatePath("/dashboard/medicines")

    return { success: true, message: "Relasi supplier-obat berhasil dihapus" }
  } catch (error: unknown) {
    console.error("DELETE_SUPPLIER_MEDICINE_ERROR:", error)
    return { message: getErrorMessage(error) }
  }
}
