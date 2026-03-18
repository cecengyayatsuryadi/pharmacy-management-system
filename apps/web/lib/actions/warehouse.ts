"use server"

import { auth } from "@/auth"
import { db, warehouses } from "@workspace/database"
import { and, eq, ilike, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getErrorMessage } from "@/lib/utils/error"

const warehouseSchema = z.object({
  name: z.string().min(1, "Nama gudang wajib diisi"),
  code: z.string().min(1, "Kode gudang wajib diisi"),
  address: z.string().optional(),
  isActive: z.preprocess((v) => v === "true" || v === true, z.boolean()).default(true),
})

export async function getWarehousesAction() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("Unauthorized")
  }

  return await db.query.warehouses.findMany({
    where: eq(warehouses.organizationId, organizationId),
    orderBy: (warehouses, { asc }) => [asc(warehouses.name)],
  })
}

export async function createWarehouseAction(_prevState: any, formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { message: "Unauthorized" }
  }

  const validatedFields = warehouseSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal membuat gudang. Mohon periksa input Anda.",
    }
  }

  try {
    await db.insert(warehouses).values({
      organizationId,
      ...validatedFields.data,
    })

    revalidatePath("/dashboard/inventory/warehouse")
    return { success: true, message: "Gudang berhasil dibuat" }
  } catch (error) {
    return { message: getErrorMessage(error) }
  }
}

export async function updateWarehouseAction(id: string, _prevState: any, formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { message: "Unauthorized" }
  }

  const validatedFields = warehouseSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal memperbarui gudang. Mohon periksa input Anda.",
    }
  }

  try {
    await db.update(warehouses)
      .set({ ...validatedFields.data, updatedAt: new Date() })
      .where(and(eq(warehouses.id, id), eq(warehouses.organizationId, organizationId)))

    revalidatePath("/dashboard/inventory/warehouse")
    return { success: true, message: "Gudang berhasil diperbarui" }
  } catch (error) {
    return { message: getErrorMessage(error) }
  }
}
