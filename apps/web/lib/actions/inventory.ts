"use server"

import { auth } from "@/auth"
import { db, medicines, stockMovements, users } from "@workspace/database"
import { eq, and, desc, ilike, or, sql, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getErrorMessage } from "@/lib/utils/error"

const stockMovementSchema = z.object({
  medicineId: z.string().uuid({ message: "Obat tidak valid" }),
  type: z.enum(["in", "out", "adjustment"], { message: "Tipe transaksi tidak valid" }),
  quantity: z.coerce.number().finite().nonnegative({ message: "Jumlah harus berupa angka positif" }),
  priceAtTransaction: z.string().optional().default("0"),
  reference: z.string().optional(),
  note: z.string().optional(),
})

export async function getStockMovementsAction(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  type: "in" | "out" | "adjustment"
) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("Unauthorized")
  }

  const offset = (page - 1) * limit

  // 1. Build where clause
  const baseCondition = and(
    eq(stockMovements.organizationId, organizationId),
    eq(stockMovements.type, type)
  )

  const searchCondition = search
    ? or(
        ilike(medicines.name, `%${search}%`),
        ilike(stockMovements.reference, `%${search}%`),
        ilike(stockMovements.note, `%${search}%`)
      )
    : undefined

  const finalCondition = searchCondition 
    ? and(baseCondition, searchCondition)
    : baseCondition

  // 2. Fetch data with joins
  const data = await db
    .select({
      id: stockMovements.id,
      type: stockMovements.type,
      quantity: stockMovements.quantity,
      resultingStock: stockMovements.resultingStock,
      reference: stockMovements.reference,
      note: stockMovements.note,
      createdAt: stockMovements.createdAt,
      medicine: medicines,
      user: users,
    })
    .from(stockMovements)
    .innerJoin(medicines, eq(stockMovements.medicineId, medicines.id))
    .innerJoin(users, eq(stockMovements.userId, users.id))
    .where(finalCondition)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(stockMovements.createdAt))

  // 3. Get total count for pagination
  const [totalCount] = await db
    .select({ count: count() })
    .from(stockMovements)
    .innerJoin(medicines, eq(stockMovements.medicineId, medicines.id))
    .where(finalCondition)

  const total = Number(totalCount.count)
  const totalPages = Math.ceil(total / limit)

  return {
    data,
    metadata: {
      total,
      page,
      limit,
      totalPages,
    },
  }
}

export async function createStockMovementAction(prevState: any, formData: FormData) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  const userId = session?.user?.id

  if (!organizationId || !userId) {
    return { message: "Unauthorized" }
  }

  const validatedFields = stockMovementSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal memproses stok. Mohon periksa input Anda.",
    }
  }

  const { medicineId, type, quantity: inputQty, priceAtTransaction, reference, note } = validatedFields.data

  if ((type === "in" || type === "out") && inputQty <= 0) {
    return {
      errors: { quantity: ["Jumlah harus lebih dari 0 untuk transaksi masuk/keluar"] },
      message: "Gagal memproses stok. Mohon periksa input Anda.",
    }
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Ambil data obat dengan Row Level Locking (FOR UPDATE)
      // Ini mencegah race condition jika ada update simultan
      const [medicine] = await tx
        .select()
        .from(medicines)
        .where(and(
          eq(medicines.id, medicineId), 
          eq(medicines.organizationId, organizationId)
        ))
        .for("update") // Lock baris ini sampai transaksi selesai

      if (!medicine) {
        throw new Error("Obat tidak ditemukan")
      }

      const currentStock = Number(medicine.stock)
      let newStock = currentStock
      let deltaQty = 0 // Selisih mutasi untuk audit trail

      // 2. Hitung stok baru dan delta (selisih)
      if (type === "in") {
        deltaQty = inputQty
        newStock = currentStock + deltaQty
      } else if (type === "out") {
        if (currentStock < inputQty) {
          throw new Error(`Stok tidak mencukupi. Sisa stok: ${currentStock}`)
        }
        deltaQty = -inputQty // Nilai negatif untuk pengeluaran
        newStock = currentStock + deltaQty
      } else if (type === "adjustment") {
        // Pada adjustment, inputQty adalah angka STOK NYATA yang ditemukan
        newStock = inputQty
        deltaQty = newStock - currentStock // Bisa positif atau negatif
      }

      // 3. Update stok di tabel medicines
      await tx
        .update(medicines)
        .set({ stock: newStock.toString(), updatedAt: new Date() })
        .where(eq(medicines.id, medicineId))

      // 4. Catat sejarah di stock_movements
      // quantity disimpan sebagai delta (perubahan), bukan nilai input mentah
      await tx.insert(stockMovements).values({
        organizationId,
        medicineId,
        userId,
        type,
        quantity: deltaQty.toString(), 
        priceAtTransaction: priceAtTransaction || (type === "in" ? medicine.purchasePrice : medicine.price),
        resultingStock: newStock.toString(),
        reference,
        note: type === "adjustment" 
          ? `[Opname] Stok lama: ${currentStock}, Stok baru: ${newStock}. ${note || ""}`
          : note,
      })

      return { success: true, type, deltaQty, newStock }
    })

    // Revalidate setelah transaksi sukses
    revalidatePath("/dashboard/medicines")
    revalidatePath("/dashboard/inventory")
    revalidatePath(`/dashboard/inventory/${result.type}`)
    
    const messageLabel = {
      in: "Stok masuk berhasil dicatat",
      out: "Stok keluar berhasil dicatat",
      adjustment: "Penyesuaian stok (opname) berhasil"
    }[result.type]

    return { 
      message: messageLabel, 
      success: true 
    }
  } catch (error: unknown) {
    console.error("INVENTORY_ACTION_ERROR:", error)
    return { message: getErrorMessage(error) }
  }
}
