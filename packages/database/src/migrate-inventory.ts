import { db, organizations, medicines, warehouses, units, medicineBatches, stockItems } from "./index"
import { eq } from "drizzle-orm"

async function main() {
  console.log("🚀 Memulai Migrasi Data Inventori Baru...")

  const allOrgs = await db.select().from(organizations)

  for (const org of allOrgs) {
    console.log(`\n🏢 Memproses Organisasi: ${org.name} (${org.id})`)

    // 1. Pastikan Satuan Default (Pcs) ada
    let [defaultUnit] = await db
      .select()
      .from(units)
      .where(eq(units.organizationId, org.id))
      .limit(1)

    if (!defaultUnit) {
      console.log("  - Membuat satuan default (Pcs)...")
      const [newUnit] = await db
        .insert(units)
        .values({
          organizationId: org.id,
          name: "Pcs / Biji",
          abbreviation: "pcs",
        })
        .returning()
      defaultUnit = newUnit
    }

    // 2. Pastikan Gudang Default ada
    let [defaultWarehouse] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.organizationId, org.id))
      .limit(1)

    if (!defaultWarehouse) {
      console.log("  - Membuat gudang default (Gudang Utama)...")
      const [newWarehouse] = await db
        .insert(warehouses)
        .values({
          organizationId: org.id,
          code: "GUD-UTAMA",
          name: "Gudang Utama",
          isActive: true,
        })
        .returning()
      defaultWarehouse = newWarehouse
    }

    // 3. Migrasi Stok Obat
    const orgMedicines = await db
      .select()
      .from(medicines)
      .where(eq(medicines.organizationId, org.id))

    for (const med of orgMedicines) {
      // Update Base Unit ID jika masih kosong
      if (!med.baseUnitId && defaultUnit) {
        await db
          .update(medicines)
          .set({ baseUnitId: defaultUnit.id })
          .where(eq(medicines.id, med.id))
      }

      const currentStock = Number(med.stock)
      if (currentStock > 0) {
        console.log(`  - Migrasi stok ${med.name}: ${currentStock} ${med.unit}`)

        // Buat batch awal dummy
        const [initialBatch] = await db
          .insert(medicineBatches)
          .values({
            organizationId: org.id,
            medicineId: med.id,
            batchNumber: "INITIAL-STOCK",
            expiryDate: med.expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 2)), // Fallback 2 tahun
          })
          .returning()

        // Masukkan ke saldo stok gudang utama
        await db.insert(stockItems).values({
          organizationId: org.id,
          warehouseId: defaultWarehouse.id,
          medicineId: med.id,
          batchId: initialBatch.id,
          quantity: currentStock.toString(),
        })
      }
    }
  }

  console.log("\n✅ MIGRASI SELESAI! Seluruh data stok lama telah dipindahkan ke sistem baru.")
  process.exit(0)
}

main().catch((err) => {
  console.error("\n❌ GAGAL MIGRASI:", err)
  process.exit(1)
})
