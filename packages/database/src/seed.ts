import { db, organizations, categories, medicines, users, stockMovements, memberships, units, warehouses } from "./index"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"

async function main() {
  console.log("🌱 Memulai Seeding Data Obat Variatif & Realistis...")

  const DEMO_EMAIL = "demo@google.com"
  const DEMO_PASS = "demo123"
  const ORG_NAME = "Apotek Demo"

  // 1. Pastikan Organisasi Ada
  let org = await db.query.organizations.findFirst({
    where: eq(organizations.name, ORG_NAME)
  })

  if (!org) {
    console.log(`🏢 Membuat Organisasi: ${ORG_NAME}`)
    const [newOrg] = await db.insert(organizations).values({
      name: ORG_NAME,
      slug: "apotek-demo",
      plan: "pro",
      address: "Jl. Raya Farmasi No. 123, Jakarta Selatan",
      phone: "021-5550123",
      description: "Apotek percontohan untuk fitur manajemen SaaS.",
    }).returning()
    org = newOrg
  }

  if (!org) throw new Error("Gagal menginisialisasi organisasi")

  // 2. Pastikan User Demo Ada
  let demoUser = await db.query.users.findFirst({
    where: eq(users.email, DEMO_EMAIL)
  })

  if (!demoUser) {
    console.log(`👤 Membuat User Baru: ${DEMO_EMAIL}`)
    const hashedPassword = await bcrypt.hash(DEMO_PASS, 10)
    const [newUser] = await db.insert(users).values({
      name: "Demo Admin",
      email: DEMO_EMAIL,
      password: hashedPassword,
      organizationId: org.id,
      role: "admin",
      status: "active"
    }).returning()
    demoUser = newUser
  }

  // 3. Pastikan Membership Ada
  const existingMembership = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, demoUser!.id),
      eq(memberships.organizationId, org.id)
    )
  })

  if (!existingMembership) {
    await db.insert(memberships).values({
      userId: demoUser!.id,
      organizationId: org.id,
      role: "admin"
    })
  }

  // 4. Seed Satuan Dasar (Units) & Warehouse
  console.log("📏 Menyiapkan Satuan & Gudang...")
  const seedUnits = [
    { name: "Tablet", abbreviation: "TBL" },
    { name: "Strip", abbreviation: "STP" },
    { name: "Botol", abbreviation: "BTL" },
    { name: "Box", abbreviation: "BOX" },
    { name: "Pcs", abbreviation: "PCS" },
    { name: "Tube", abbreviation: "TBE" },
    { name: "Sachet", abbreviation: "SCH" },
  ]

  for (const u of seedUnits) {
    const existing = await db.query.units.findFirst({
      where: and(eq(units.organizationId, org.id), eq(units.name, u.name))
    })
    if (!existing) await db.insert(units).values({ ...u, organizationId: org.id })
  }

  const allUnits = await db.query.units.findMany({ where: eq(units.organizationId, org.id) })
  const unitMap = Object.fromEntries(allUnits.map(u => [u.name, u.id]))

  let warehouse = await db.query.warehouses.findFirst({
    where: eq(warehouses.organizationId, org.id)
  })
  if (!warehouse) {
    const [newWh] = await db.insert(warehouses).values({
      organizationId: org.id,
      code: "G-01",
      name: "Gudang Utama",
      isActive: true
    }).returning()
    warehouse = newWh
  }

  // 5. Clear old medicine data
  console.log("🧹 Membersihkan data lama (Obat, Transaksi, & Relasi)...")
  
  // Hapus dari tabel yang bergantung (order matters)
  const { 
    supplierMedicines, 
    stockMovements: sm, 
    medicines: med, 
    categories: cat, 
    medicineBatches, 
    stockItems,
    saleItems,
    purchaseItems
  } = await import("./index")
  
  await db.delete(supplierMedicines).where(eq(supplierMedicines.organizationId, org.id))
  await db.delete(saleItems) // No organizationId in saleItems, usually handled by sale relation or we clear all if it's demo
  await db.delete(purchaseItems)
  await db.delete(sm).where(eq(sm.organizationId, org.id))
  await db.delete(stockItems).where(eq(stockItems.organizationId, org.id))
  await db.delete(medicineBatches).where(eq(medicineBatches.organizationId, org.id))
  await db.delete(med).where(eq(med.organizationId, org.id))
  await db.delete(cat).where(eq(cat.organizationId, org.id))
  
  // 6. Seed Kategori
  console.log("📦 Menyiapkan Kategori...")
  const seedCategories = [
    { name: "Obat Bebas", description: "Logo Hijau" },
    { name: "Obat Bebas Terbatas", description: "Logo Biru" },
    { name: "Obat Keras (G)", description: "Logo K Merah" },
    { name: "Psikotropika", description: "Obat Keras Tertentu" },
    { name: "Suplemen & Vitamin", description: "Vitamin harian" },
    { name: "Alat Kesehatan", description: "Non-obat" },
  ]

  const insertedCats = await db.insert(categories).values(
    seedCategories.map(cat => ({ ...cat, organizationId: org!.id }))
  ).returning()
  const catMap = Object.fromEntries(insertedCats.map(c => [c.name, c.id]))

  // 7. Seed Variatif Medicines
  console.log("💊 Menyiapkan 30+ Data Obat Realistis...")
  const medicinesToSeed = [
    // OBAT BEBAS (HIJAU)
    {
      name: "Paracetamol 500mg",
      genericName: "Paracetamol",
      code: "MED-00001",
      category: "Obat Bebas",
      classification: "Bebas",
      unit: "Tablet",
      purchasePrice: "500",
      price: "1000",
      stock: "500",
      minStock: "50",
      composition: "Paracetamol 500mg",
      indication: "Meredakan nyeri ringan dan demam",
      manufacturer: "Kimia Farma",
      description: "Obat penurun panas paling umum"
    },
    {
      name: "Antasida Doen",
      genericName: "Alumunium Hidroksida",
      code: "MED-00002",
      category: "Obat Bebas",
      classification: "Bebas",
      unit: "Tablet",
      purchasePrice: "300",
      price: "750",
      stock: "200",
      minStock: "30",
      composition: "Al(OH)3 200mg, Mg(OH)2 200mg",
      indication: "Sakit maag, kembung, perih",
      manufacturer: "Indofarma",
      description: "Obat lambung standar"
    },
    {
      name: "Promag Tablet",
      genericName: "Hydrotalcite",
      code: "MED-00003",
      category: "Obat Bebas",
      classification: "Bebas",
      unit: "Strip",
      purchasePrice: "7500",
      price: "10500",
      stock: "45",
      minStock: "10",
      composition: "Hydrotalcite 200mg, Magnesium Hydroxide 150mg",
      indication: "Asam lambung berlebih",
      manufacturer: "Kalbe Farma"
    },

    // OBAT BEBAS TERBATAS (BIRU)
    {
      name: "Cetirizine 10mg",
      genericName: "Cetirizine HCl",
      code: "MED-00004",
      category: "Obat Bebas Terbatas",
      classification: "Bebas Terbatas",
      unit: "Strip",
      purchasePrice: "5000",
      price: "8500",
      stock: "60",
      minStock: "10",
      composition: "Cetirizine Hydrochloride 10mg",
      indication: "Rhinitis alergi, biduran",
      manufacturer: "Dexa Medica"
    },
    {
      name: "Ibuprofen 400mg",
      genericName: "Ibuprofen",
      code: "MED-00005",
      category: "Obat Bebas Terbatas",
      classification: "Bebas Terbatas",
      unit: "Strip",
      purchasePrice: "8000",
      price: "13000",
      stock: "15",
      minStock: "20", // LOW STOCK CASE
      composition: "Ibuprofen 400mg",
      indication: "Nyeri sedang sampai berat, radang",
      manufacturer: "Phapros"
    },
    {
      name: "Vicks Formula 44 Adult",
      genericName: "Dextromethorphan",
      code: "MED-00006",
      category: "Obat Bebas Terbatas",
      classification: "Bebas Terbatas",
      unit: "Botol",
      purchasePrice: "16500",
      price: "22000",
      stock: "25",
      minStock: "5",
      indication: "Batuk tidak berdahak",
      manufacturer: "P&G"
    },

    // OBAT KERAS (K MERAH)
    {
      name: "Amoxicillin 500mg",
      genericName: "Amoxicillin",
      code: "MED-00007",
      category: "Obat Keras (G)",
      classification: "Keras",
      unit: "Strip",
      purchasePrice: "18000",
      price: "26000",
      stock: "40",
      minStock: "10",
      composition: "Amoxicillin Trihydrate 500mg",
      indication: "Infeksi bakteri (Antibiotik)",
      manufacturer: "Sanbe Farma",
      sideEffects: "Diare, mual, ruam kulit"
    },
    {
      name: "Amlodipine 5mg",
      genericName: "Amlodipine Besylate",
      code: "MED-00008",
      category: "Obat Keras (G)",
      classification: "Keras",
      unit: "Strip",
      purchasePrice: "12000",
      price: "18500",
      stock: "100",
      minStock: "15",
      indication: "Hipertensi (Tekanan darah tinggi)",
      manufacturer: "Biofarma"
    },
    {
      name: "Metformin 500mg",
      genericName: "Metformin HCl",
      code: "MED-00009",
      category: "Obat Keras (G)",
      classification: "Keras",
      unit: "Strip",
      purchasePrice: "15000",
      price: "22000",
      stock: "0", // OUT OF STOCK CASE
      minStock: "10",
      indication: "Diabetes Melitus Tipe 2",
      manufacturer: "Kimia Farma"
    },
    {
      name: "Asam Mefenamat 500mg",
      genericName: "Mefenamic Acid",
      code: "MED-00010",
      category: "Obat Keras (G)",
      classification: "Keras",
      unit: "Strip",
      purchasePrice: "6000",
      price: "11000",
      stock: "80",
      minStock: "20",
      indication: "Nyeri gigi, nyeri haid",
      manufacturer: "Bernofarm"
    },

    // PSIKOTROPIKA
    {
      name: "Xanax 0.5mg",
      genericName: "Alprazolam",
      code: "MED-00011",
      category: "Psikotropika",
      classification: "Psikotropika",
      unit: "Tablet",
      purchasePrice: "65000",
      price: "95000",
      stock: "2",
      minStock: "5",
      composition: "Alprazolam 0.5mg",
      indication: "Gangguan kecemasan, panik",
      manufacturer: "Pfizer",
      sideEffects: "Mengantuk, pusing, ketergantungan"
    },
    {
      name: "Diazepam 2mg",
      genericName: "Diazepam",
      code: "MED-00012",
      category: "Psikotropika",
      classification: "Psikotropika",
      unit: "Tablet",
      purchasePrice: "45000",
      price: "70000",
      stock: "10",
      minStock: "2",
      indication: "Kejang, kaku otot",
      manufacturer: "Indofarma"
    },

    // VITAMIN & SUPLEMEN
    {
      name: "Enervon-C Active",
      genericName: "Multivitamin",
      code: "MED-00013",
      category: "Suplemen & Vitamin",
      classification: "Bebas",
      unit: "Botol",
      purchasePrice: "35000",
      price: "48500",
      stock: "30",
      minStock: "5",
      composition: "Vitamin C 500mg, Vitamin B Kompleks",
      indication: "Menjaga daya tahan tubuh",
      manufacturer: "Medifarma"
    },
    {
      name: "Sangobion Caps",
      genericName: "Suplemen Zat Besi",
      code: "MED-00014",
      category: "Suplemen & Vitamin",
      classification: "Bebas",
      unit: "Strip",
      purchasePrice: "18000",
      price: "24500",
      stock: "15",
      minStock: "10",
      indication: "Anemia / kurang darah",
      manufacturer: "Merck"
    },

    // ALAT KESEHATAN
    {
      name: "Termometer Digital Omron",
      code: "MED-00015",
      category: "Alat Kesehatan",
      classification: "Bebas",
      unit: "Pcs",
      purchasePrice: "65000",
      price: "95000",
      stock: "5",
      minStock: "2",
      manufacturer: "Omron",
      description: "Alat pengukur suhu tubuh akurasi tinggi"
    },
    {
      name: "Masker Sensi 3-Ply Earloop",
      code: "MED-00016",
      category: "Alat Kesehatan",
      classification: "Bebas",
      unit: "Box",
      purchasePrice: "38000",
      price: "55000",
      stock: "100",
      minStock: "10",
      manufacturer: "Arista",
      description: "Masker bedah 3 lapis"
    }
  ]

  const insertedMedicines = await db.insert(medicines).values(
    medicinesToSeed.map(m => {
      const categoryId = catMap[m.category] || (insertedCats[0] ? insertedCats[0].id : "");
      const baseUnitId = unitMap[m.unit] || (allUnits[0] ? allUnits[0].id : "");
      
      if (!categoryId || !baseUnitId) {
        throw new Error(`Missing category or unit for medicine: ${m.name}`);
      }

      return {
        organizationId: org!.id,
        categoryId,
        baseUnitId,
        code: m.code,
        name: m.name,
        genericName: m.genericName || null,
        classification: m.classification || "Bebas",
        purchasePrice: m.purchasePrice,
        price: m.price,
        stock: m.stock,
        minStock: m.minStock,
        composition: m.composition || null,
        indication: m.indication || null,
        manufacturer: m.manufacturer || null,
        description: m.description || null,
        isActive: true,
        unit: m.unit.toLowerCase(), // fallback
      };
    })
  ).returning()

  // 8. Seed Stock Movements (Initial Ledger)
  console.log("📦 Menyiapkan Ledger Stok...")
  const movements = insertedMedicines.map(med => ({
    organizationId: org!.id,
    medicineId: med.id,
    userId: demoUser!.id,
    warehouseId: warehouse!.id,
    type: "in",
    quantity: med.stock,
    priceAtTransaction: med.purchasePrice,
    balanceBefore: "0",
    resultingStock: med.stock,
    note: "Stok awal (Seeding Data Variatif)",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  }))

  await db.insert(stockMovements).values(movements)

  console.log("✅ SEEDING DATA VARIATIF SELESAI!")
  process.exit(0)
}

main().catch((err) => {
  console.error("❌ GAGAL SEEDING:", err)
  process.exit(1)
})
