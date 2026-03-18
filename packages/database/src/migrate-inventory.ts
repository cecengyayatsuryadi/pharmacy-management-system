import { db, medicines, stockMovements, stockItems, medicineBatches, warehouses } from "./index"
import { eq } from "drizzle-orm"

async function main() {
  console.log("🚀 Memulai Migrasi Saldo Stok ke Tabel Inventory Baru...")

  // 1. Ambil data obat yang punya stok > 0
  const allMedicines = await db.query.medicines.findMany()
  
  // 2. Ambil gudang default (buat aja satu kalo belum ada)
  let defaultWarehouse = await db.query.warehouses.findFirst()
  if (!defaultWarehouse) {
    console.log("🏪 Membuat Gudang Utama...")
    const [newWarehouse] = await db.insert(warehouses).values({
      name: "Gudang Utama",
      code: "WH-MAIN",
      organizationId: allMedicines[0]?.organizationId || "",
      address: "Alamat default hasil migrasi",
    }).returning()
    defaultWarehouse = newWarehouse
  }

  if (!defaultWarehouse) throw new Error("Gagal menginisialisasi gudang default")

  for (const med of allMedicines) {
    const currentStock = parseFloat(med.stock)
    
    if (currentStock > 0) {
      console.log(`📦 Memigrasi stok: ${med.name} (${currentStock})`)

      // 3. Buat Batch awal untuk stok yang ada sekarang
      const [initialBatch] = await db.insert(medicineBatches).values({
        medicineId: med.id,
        organizationId: med.organizationId,
        batchNumber: "BATCH-INITIAL",
        expiryDate: med.expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 2)), // Default 2 tahun kalo kosong
      }).returning()

      if (initialBatch) {
        // 4. Masukkan ke tabel stock_items (Inventory)
        await db.insert(stockItems).values({
          medicineId: med.id,
          organizationId: med.organizationId,
          warehouseId: defaultWarehouse.id,
          batchId: initialBatch.id,
          quantity: med.stock,
        })

        // 5. Catat movement sebagai 'in' (saldo awal)
        await db.insert(stockMovements).values({
          medicineId: med.id,
          organizationId: med.organizationId,
          userId: "SYSTEM", // Placeholder user ID
          warehouseId: defaultWarehouse.id,
          batchId: initialBatch.id,
          type: "in",
          quantity: med.stock,
          note: "Saldo awal hasil migrasi sistem",
        })
      }
    }
  }

  console.log("✅ Migrasi Stok Selesai!")
  process.exit(0)
}

main().catch((err) => {
  console.error("❌ GAGAL MIGRASI:", err)
  process.exit(1)
})
