"use server"

import { auth } from "@/auth"
import { db, unitConversions, medicines, units } from "@workspace/database"
import { and, eq, ilike, or, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getErrorMessage } from "@/lib/utils/error"

const conversionSchema = z.object({
  medicineId: z.string().uuid("Obat tidak valid"),
  fromUnitId: z.string().uuid("Satuan asal tidak valid"),
  toUnitId: z.string().uuid("Satuan tujuan tidak valid"),
  factor: z.coerce.number().positive("Faktor konversi harus lebih dari 0"),
})

export async function getConversionsAction(page: number = 1, limit: number = 10, search: string = "") {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("Unauthorized")
  }

  const offset = (page - 1) * limit

  // Define filters
  const baseCondition = eq(unitConversions.organizationId, organizationId)
  
  if (search) {
    // If search is provided, we need to filter by medicine name using a join.
    // We get the IDs first to maintain compatibility with findMany 'with' syntax.
    const searchData = await db
      .select({ id: unitConversions.id })
      .from(unitConversions)
      .innerJoin(medicines, eq(unitConversions.medicineId, medicines.id))
      .where(
        and(
          baseCondition,
          ilike(medicines.name, `%${search}%`)
        )
      )
      .limit(limit)
      .offset(offset)

    const ids = searchData.map(d => d.id)
    
    if (ids.length === 0) {
      return {
        data: [],
        metadata: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        }
      }
    }

    // Fetch full relations for the found IDs
    const fullData = await db.query.unitConversions.findMany({
      where: or(...ids.map(id => eq(unitConversions.id, id))),
      with: {
        medicine: true,
        fromUnit: true,
        toUnit: true,
      },
    })

    const totalCountResult = await db
      .select({ count: count() })
      .from(unitConversions)
      .innerJoin(medicines, eq(unitConversions.medicineId, medicines.id))
      .where(and(baseCondition, ilike(medicines.name, `%${search}%`)))

    const total = totalCountResult[0]?.count ?? 0

    return {
      data: fullData,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }
  }

  // Default case: No search
  const [data, totalCountResult] = await Promise.all([
    db.query.unitConversions.findMany({
      where: baseCondition,
      with: {
        medicine: true,
        fromUnit: true,
        toUnit: true,
      },
      limit,
      offset,
      orderBy: (unitConversions, { asc }) => [asc(unitConversions.medicineId)],
    }),
    db.select({ count: count() }).from(unitConversions).where(baseCondition)
  ])

  const total = totalCountResult[0]?.count ?? 0

  return {
    data,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
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

export async function updateConversionAction(id: string, _prevState: any, formData: FormData) {
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
      message: "Gagal memperbarui konversi. Mohon periksa input Anda.",
    }
  }

  try {
    await db
      .update(unitConversions)
      .set({
        ...validatedFields.data,
        factor: validatedFields.data.factor.toString(),
      })
      .where(and(eq(unitConversions.id, id), eq(unitConversions.organizationId, organizationId)))

    revalidatePath("/dashboard/inventory/master/units")
    return { success: true, message: "Konversi berhasil diperbarui" }
  } catch (error) {
    return { message: getErrorMessage(error) }
  }
}

export async function deleteConversionAction(id: string) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    await db
      .delete(unitConversions)
      .where(and(eq(unitConversions.id, id), eq(unitConversions.organizationId, organizationId)))

    revalidatePath("/dashboard/inventory/master/units")
    return { success: true, message: "Konversi berhasil dihapus" }
  } catch (error) {
    return { success: false, message: getErrorMessage(error) }
  }
}
