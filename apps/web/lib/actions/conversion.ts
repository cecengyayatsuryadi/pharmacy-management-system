"use server"

import { auth } from "@/auth"
import { db, unitConversions, medicines, units } from "@workspace/database"
import { and, eq, ilike, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getErrorMessage } from "@/lib/utils/error"

const conversionSchema = z.object({
  medicineId: z.string().uuid("Obat tidak valid"),
  fromUnitId: z.string().uuid("Satuan asal tidak valid"),
  toUnitId: z.string().uuid("Satuan tujuan tidak valid"),
  factor: z.coerce.number().positive("Faktor konversi harus lebih dari 0"),
})

export async function getConversionsAction(medicineId?: string) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("Unauthorized")
  }

  const baseCondition = eq(unitConversions.organizationId, organizationId)
  const condition = medicineId ? and(baseCondition, eq(unitConversions.medicineId, medicineId)) : baseCondition

  return await db.query.unitConversions.findMany({
    where: condition,
    with: {
      medicine: true,
      fromUnit: true,
      toUnit: true,
    }
  })
}

export async function createConversionAction(_prevState: any, formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { message: "Unauthorized" }
  }

  const validatedFields = conversionSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal membuat konversi. Mohon periksa input Anda.",
    }
  }

  try {
    await db.insert(unitConversions).values({
      organizationId,
      ...validatedFields.data,
      factor: validatedFields.data.factor.toString(),
    })

    revalidatePath("/dashboard/inventory/master/units")
    return { success: true, message: "Konversi berhasil dibuat" }
  } catch (error) {
    return { message: getErrorMessage(error) }
  }
}
