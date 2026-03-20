"use server"

import { auth } from "@/auth"
import { db, medicineFormularies, medicineSubstitutions, medicines } from "@workspace/database"
import { eq, and, count, ilike, or, type SQL, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const formularySchema = z.object({
  medicineId: z.string().uuid({ message: "Obat tidak valid" }),
  type: z.string().min(1, { message: "Tipe formularium harus diisi" }),
  status: z.boolean().default(true),
  note: z.string().optional().nullable(),
})

const substitutionSchema = z.object({
  medicineId: z.string().uuid({ message: "Obat utama tidak valid" }),
  substituteMedicineId: z.string().uuid({ message: "Obat pengganti tidak valid" }),
  note: z.string().optional().nullable(),
})

export async function getFormulariesAction(page = 1, limit = 10, search = "", type = "") {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) throw new Error("Unauthorized")

  const offset = (page - 1) * limit
  const filters: (SQL | undefined)[] = [eq(medicineFormularies.organizationId, organizationId)]

  if (search) {
    // Cari berdasarkan nama obat
    const medicineSearch = await db.query.medicines.findMany({
      where: and(
        eq(medicines.organizationId, organizationId),
        ilike(medicines.name, `%${search}%`)
      ),
      columns: { id: true }
    })
    const medicineIds = medicineSearch.map(m => m.id)
    if (medicineIds.length > 0) {
      filters.push(or(...medicineIds.map(id => eq(medicineFormularies.medicineId, id))))
    } else {
      // Jika tidak ada obat yang cocok, buat query yang pasti kosong
      filters.push(eq(medicineFormularies.id, "00000000-0000-0000-0000-000000000000"))
    }
  }

  if (type && type !== "all") {
    filters.push(eq(medicineFormularies.type, type))
  }

  const whereClause = and(...filters)

  const data = await db.query.medicineFormularies.findMany({
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
  })

  const countResult = await db.select({ value: count() }).from(medicineFormularies).where(whereClause)
  const total = countResult[0]?.value ?? 0

  return { data, metadata: { total, page, limit } }
}

export async function upsertFormularyAction(formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  if (!organizationId) return { error: "Unauthorized" }

  const rawData = {
    medicineId: formData.get("medicineId"),
    type: formData.get("type"),
    status: formData.get("status") === "true",
    note: formData.get("note"),
  }

  const validatedData = formularySchema.safeParse(rawData)
  if (!validatedData.success) {
    return { errors: validatedData.error.flatten().fieldErrors }
  }

  const id = formData.get("id") as string | null

  try {
    if (id) {
      await db.update(medicineFormularies)
        .set({ ...validatedData.data, updatedAt: new Date() })
        .where(and(eq(medicineFormularies.id, id), eq(medicineFormularies.organizationId, organizationId)))
    } else {
      await db.insert(medicineFormularies).values({
        ...validatedData.data,
        organizationId,
      })
    }

    revalidatePath("/dashboard/inventory/master/formulary")
    return { message: id ? "Formularium diperbarui" : "Formularium ditambahkan" }
  } catch (_error) {
    return { error: "Gagal menyimpan data formularium" }
  }
}

export async function deleteFormularyAction(id: string) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  if (!organizationId) return { error: "Unauthorized" }

  try {
    await db.delete(medicineFormularies).where(and(eq(medicineFormularies.id, id), eq(medicineFormularies.organizationId, organizationId)))
    revalidatePath("/dashboard/inventory/master/formulary")
    return { message: "Formularium dihapus" }
  } catch (_error) {
    return { error: "Gagal menghapus formularium" }
  }
}

export async function getSubstitutionsAction(page = 1, limit = 10, search = "", medicineId = "") {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  if (!organizationId) throw new Error("Unauthorized")

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
        ...medicineIds.map(id => eq(medicineSubstitutions.medicineId, id)),
        ...medicineIds.map(id => eq(medicineSubstitutions.substituteMedicineId, id))
      ))
    } else {
      filters.push(eq(medicineSubstitutions.id, "00000000-0000-0000-0000-000000000000"))
    }
  }

  if (medicineId) {
    filters.push(eq(medicineSubstitutions.medicineId, medicineId))
  }

  const whereClause = and(...filters)

  const data = await db.query.medicineSubstitutions.findMany({
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
  })

  const countResult = await db.select({ value: count() }).from(medicineSubstitutions).where(whereClause)
  const total = countResult[0]?.value ?? 0

  return { data, metadata: { total, page, limit } }
}

export async function createSubstitutionAction(formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  if (!organizationId) return { error: "Unauthorized" }

  const rawData = {
    medicineId: formData.get("medicineId"),
    substituteMedicineId: formData.get("substituteMedicineId"),
    note: formData.get("note"),
  }

  const validatedData = substitutionSchema.safeParse(rawData)
  if (!validatedData.success) {
    return { errors: validatedData.error.flatten().fieldErrors }
  }

  if (validatedData.data.medicineId === validatedData.data.substituteMedicineId) {
    return { error: "Obat tidak bisa mensubstitusi dirinya sendiri" }
  }

  try {
    await db.insert(medicineSubstitutions).values({
      ...validatedData.data,
      organizationId,
    })
    revalidatePath("/dashboard/inventory/master/formulary")
    return { message: "Substitusi ditambahkan" }
  } catch (_error) {
    return { error: "Gagal menyimpan data substitusi" }
  }
}

export async function deleteSubstitutionAction(id: string) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  if (!organizationId) return { error: "Unauthorized" }

  try {
    await db.delete(medicineSubstitutions).where(and(eq(medicineSubstitutions.id, id), eq(medicineSubstitutions.organizationId, organizationId)))
    revalidatePath("/dashboard/inventory/master/formulary")
    return { message: "Substitusi dihapus" }
  } catch (_error) {
    return { error: "Gagal menghapus substitusi" }
  }
}
