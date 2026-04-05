"use server"




import { db, medicines, prescriptions, prescriptionItems, prescriptionItemComponents } from "@workspace/database"
import { eq, and, desc, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getErrorMessage } from "@/lib/utils/error"
import { getAuthenticatedSession } from "@/lib/utils/action-utils"

// Schema for standard medicine item
const prescriptionItemSchema = z.object({
  isCompounded: z.literal(false),
  medicineId: z.string().uuid("Obat tidak valid"),
  quantity: z.number().positive("Jumlah harus lebih dari 0"),
  instructions: z.string().optional(),
})

// Schema for compounded medicine item
const prescriptionCompoundedItemSchema = z.object({
  isCompounded: z.literal(true),
  compoundedName: z.string().min(1, "Nama racikan wajib diisi"),
  compoundingFee: z.number().nonnegative("Biaya racik tidak boleh negatif"),
  quantity: z.number().positive("Jumlah paket/bungkus harus lebih dari 0"), // Number of packages (e.g. 10 puyer)
  instructions: z.string().optional(),
  components: z.array(z.object({
    medicineId: z.string().uuid("Obat komponen tidak valid"),
    quantityPerPackage: z.number().positive("Jumlah komponen per paket harus lebih dari 0"),
  })).min(1, "Racikan harus memiliki minimal 1 komponen obat"),
})

const prescriptionSchema = z.object({
  doctorName: z.string().min(1, "Nama dokter wajib diisi"),
  patientName: z.string().min(1, "Nama pasien wajib diisi"),
  patientAge: z.number().positive().optional(),
  patientAddress: z.string().optional(),
  patientPhone: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.discriminatedUnion("isCompounded", [
    prescriptionItemSchema,
    prescriptionCompoundedItemSchema
  ])).min(1, "Resep minimal memiliki 1 obat/racikan"),
})

export type PrescriptionInput = z.infer<typeof prescriptionSchema>

export async function createPrescriptionAction(data: PrescriptionInput) {
  const session = await getAuthenticatedSession()
  if (!session) return { error: "Unauthorized" }
  const { organizationId, userId } = session

  const validatedFields = prescriptionSchema.safeParse(data)
  if (!validatedFields.success) {
    return {
      error: "Input tidak valid",
      details: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { doctorName, patientName, patientAge, patientAddress, patientPhone, notes, items } = validatedFields.data

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Generate Prescription Number
      const today = new Date()
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")

      const lastPrescription = await tx.query.prescriptions.findFirst({
        where: eq(prescriptions.organizationId, organizationId),
        orderBy: [desc(prescriptions.createdAt)],
      })

      let sequence = 1
      if (lastPrescription && lastPrescription.prescriptionNumber.includes(dateStr)) {
        const lastSeq = parseInt(lastPrescription.prescriptionNumber.split("-").pop() || "0")
        sequence = lastSeq + 1
      }
      const prescriptionNumber = `RX-${dateStr}-${sequence.toString().padStart(4, "0")}`

      // 2. Fetch required medicines for pricing
      const requiredMedicineIds = new Set<string>()
      items.forEach(item => {
        if (!item.isCompounded) {
          requiredMedicineIds.add(item.medicineId)
        } else {
          item.components.forEach(comp => requiredMedicineIds.add(comp.medicineId))
        }
      })

      const fetchedMedicines = await tx
        .select()
        .from(medicines)
        .where(
          and(
            inArray(medicines.id, Array.from(requiredMedicineIds)),
            eq(medicines.organizationId, organizationId)
          )
        )
      const medicineMap = new Map(fetchedMedicines.map(m => [m.id, m]))

      // Validate all medicines exist
      requiredMedicineIds.forEach(id => {
        if (!medicineMap.has(id)) throw new Error(`Obat tidak ditemukan: ${id}`)
      })

      // 3. Create Prescription Header
      const [prescription] = await tx.insert(prescriptions).values({
        organizationId,
        userId,
        prescriptionNumber,
        doctorName,
        patientName,
        patientAge,
        patientAddress,
        patientPhone,
        notes,
        status: "PENDING",
      }).returning()

      // 4. Create Items & Components
      for (const item of items) {
        if (!item.isCompounded) {
          const medicine = medicineMap.get(item.medicineId)!
          const price = parseFloat(medicine.price) || 0
          const totalPrice = price * item.quantity

          await tx.insert(prescriptionItems).values({
            prescriptionId: prescription!.id,
            medicineId: item.medicineId,
            isCompounded: false,
            quantity: item.quantity.toString(),
            instructions: item.instructions,
            totalPrice: totalPrice.toString(),
          })
        } else {
          // Compounded logic
          let componentsTotal = 0
          const itemComponentsData = item.components.map(comp => {
            const medicine = medicineMap.get(comp.medicineId)!
            const price = parseFloat(medicine.price) || 0
            const totalQty = comp.quantityPerPackage * item.quantity
            const compTotal = price * totalQty
            componentsTotal += compTotal

            return {
              medicineId: comp.medicineId,
              quantityPerPackage: comp.quantityPerPackage.toString(),
              totalQuantity: totalQty.toString(),
              priceAtPrescription: price.toString(),
            }
          })

          const finalTotalPrice = componentsTotal + item.compoundingFee

          const [pItem] = await tx.insert(prescriptionItems).values({
            prescriptionId: prescription!.id,
            isCompounded: true,
            compoundedName: item.compoundedName,
            compoundingFee: item.compoundingFee.toString(),
            quantity: item.quantity.toString(),
            instructions: item.instructions,
            totalPrice: finalTotalPrice.toString(),
          }).returning()

          const componentsToInsert = itemComponentsData.map(c => ({
            ...c,
            prescriptionItemId: pItem!.id
          }))

          if (componentsToInsert.length > 0) {
            await tx.insert(prescriptionItemComponents).values(componentsToInsert)
          }
        }
      }

      return prescription!.id
    })

    revalidatePath("/dashboard/prescriptions")
    return { data: { id: result } }
  } catch (error: unknown) {
    return { error: getErrorMessage(error) }
  }
}

export async function getPrescriptionsAction() {
  try {
    const session = await getAuthenticatedSession()
    if (!session) return { data: [] }

    const results = await db.query.prescriptions.findMany({
      where: eq(prescriptions.organizationId, session.organizationId),
      orderBy: [desc(prescriptions.createdAt)],
      with: {
        items: {
          with: {
            medicine: true,
            components: {
              with: { medicine: true }
            }
          }
        }
      }
    })

    return { data: results }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }
}
