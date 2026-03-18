"use server"

import { auth } from "@/auth"
import { db, units } from "@workspace/database"
import { and, eq, ilike, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getErrorMessage } from "@/lib/utils/error"

const unitSchema = z.object({
  name: z.string().min(1, "Nama satuan wajib diisi"),
  abbreviation: z.string().min(1, "Singkatan wajib diisi"),
})

export async function getUnitsAction() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("Unauthorized")
  }

  return await db.query.units.findMany({
    where: eq(units.organizationId, organizationId),
    orderBy: (units, { asc }) => [asc(units.name)],
  })
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
