import { db, organizations, categories, medicines, users, stockMovements, memberships } from "./index"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"

async function main() {
  console.log("🌱 Memulai Seeding untuk Akun Demo (Multi-Branch & Refined Data)...")

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

  if (!demoUser) throw new Error("Gagal menginisialisasi user demo")

  // 3. Pastikan Membership Ada (Relasi N:N)
  const existingMembership = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, demoUser.id),
      eq(memberships.organizationId, org.id)
    )
  })

  if (!existingMembership) {
    console.log(`🔑 Menambahkan Membership untuk ${DEMO_EMAIL} di ${ORG_NAME}`)
    await db.insert(memberships).values({
      userId: demoUser.id,
      organizationId: org.id,
      role: "admin"
    })
  }

  console.log(`✅ Menggunakan Organisasi: ${org.name} (${org.id})`)

  // 4. Clear existing data for this org
  console.log("🧹 Membersihkan data lama...")
  await db.delete(stockMovements).where(eq(stockMovements.organizationId, org.id))
  await db.delete(medicines).where(eq(medicines.organizationId, org.id))
  await db.delete(categories).where(eq(categories.organizationId, org.id))
  
  // 5. Seed Kategori
  console.log("📦 Menyiapkan Kategori...")
  const seedCategories = [
    { name: "Obat Bebas", description: "Obat yang dapat dibeli bebas tanpa resep (Logo Hijau)" },
    { name: "Obat Bebas Terbatas", description: "Obat keras dengan peringatan (Logo Biru)" },
    { name: "Obat Keras (G)", description: "Obat yang harus dengan resep dokter (Logo K)" },
    { name: "Psikotropika", description: "Obat yang mempengaruhi fungsi psikis" },
    { name: "Suplemen & Vitamin", description: "Vitamin dan suplemen makanan" },
    { name: "Alat Kesehatan", description: "Masker, Handsanitizer, dll." },
  ]

  const insertedCats = await db.insert(categories).values(
    seedCategories.map(cat => ({ ...cat, organizationId: org!.id }))
  ).returning()

  // 6. Seed 50+ Obat-obatan
  console.log("💊 Menyiapkan 50+ Data Obat...")
  const catMap = Object.fromEntries(insertedCats.map(c => [c.name, c.id]))

  const seedMedicinesData = [
    { name: "Paracetamol 500mg", sku: "PCT-001", categoryName: "Obat Bebas", purchasePrice: "10000", price: "15000", stock: "50", minStock: "10", unit: "strip", expiryDate: new Date("2027-12-31") },
    { name: "Amoxicillin 500mg", sku: "AMX-002", categoryName: "Obat Keras (G)", purchasePrice: "18000", price: "25000", stock: "20", minStock: "5", unit: "strip", expiryDate: new Date("2026-06-15") },
    { name: "Xanax 0.5mg", sku: "XNX-003", categoryName: "Psikotropika", purchasePrice: "60000", price: "85000", stock: "3", minStock: "5", unit: "tablet", expiryDate: new Date("2026-01-01") },
    { name: "Neurobion Forte", sku: "NRB-004", categoryName: "Suplemen & Vitamin", purchasePrice: "35000", price: "45000", stock: "15", minStock: "5", unit: "box", expiryDate: new Date("2028-10-20") },
    { name: "Masker Sensi 3-Ply", sku: "MSK-005", categoryName: "Alat Kesehatan", purchasePrice: "35000", price: "50000", stock: "100", minStock: "20", unit: "box", expiryDate: null },
    { name: "Dexamethasone", sku: "DEX-006", categoryName: "Obat Keras (G)", purchasePrice: "8000", price: "12000", stock: "30", minStock: "10", unit: "strip", expiryDate: new Date("2026-03-20") },
    { name: "Captopril 25mg", sku: "CPT-007", categoryName: "Obat Keras (G)", purchasePrice: "12000", price: "18000", stock: "4", minStock: "10", unit: "strip", expiryDate: new Date("2027-05-10") },
    { name: "Antasida Doen", sku: "ANT-008", categoryName: "Obat Bebas", purchasePrice: "3000", price: "5000", stock: "100", minStock: "20", unit: "tablet", expiryDate: new Date("2027-11-25") },
    { name: "Betadine 30ml", sku: "BTD-009", categoryName: "Obat Bebas Terbatas", purchasePrice: "15000", price: "22000", stock: "25", minStock: "5", unit: "botol", expiryDate: new Date("2028-01-15") },
    { name: "Cetirizine", sku: "CTZ-010", categoryName: "Obat Bebas Terbatas", purchasePrice: "6000", price: "10000", stock: "60", minStock: "10", unit: "strip", expiryDate: new Date("2026-04-05") },
    { name: "Diazepam 2mg", sku: "DZP-011", categoryName: "Psikotropika", purchasePrice: "50000", price: "75000", stock: "5", minStock: "2", unit: "tablet", expiryDate: new Date("2026-08-30") },
    { name: "Sangobion", sku: "SNG-012", categoryName: "Suplemen & Vitamin", purchasePrice: "25000", price: "35000", stock: "2", minStock: "10", unit: "strip", expiryDate: new Date("2027-02-14") },
    { name: "Vitamin C 500mg", sku: "VIT-013", categoryName: "Suplemen & Vitamin", purchasePrice: "12000", price: "20000", stock: "150", minStock: "30", unit: "botol", expiryDate: new Date("2028-06-30") },
    { name: "Handsanitizer 500ml", sku: "HSN-014", categoryName: "Alat Kesehatan", purchasePrice: "20000", price: "30000", stock: "45", minStock: "10", unit: "botol", expiryDate: null },
    { name: "Termometer Digital", sku: "TRM-015", categoryName: "Alat Kesehatan", purchasePrice: "45000", price: "65000", stock: "10", minStock: "2", unit: "pcs", expiryDate: null },
    { name: "Salbutamol 2mg", sku: "SBT-016", categoryName: "Obat Keras (G)", purchasePrice: "10000", price: "15000", stock: "25", minStock: "5", unit: "strip", expiryDate: new Date("2026-09-12") },
    { name: "Loperamide", sku: "LOP-017", categoryName: "Obat Bebas Terbatas", purchasePrice: "5000", price: "8000", stock: "8", minStock: "10", unit: "strip", expiryDate: new Date("2027-04-20") },
    { name: "Insto Eye Drops", sku: "INS-018", categoryName: "Obat Bebas Terbatas", purchasePrice: "12000", price: "18500", stock: "35", minStock: "5", unit: "botol", expiryDate: new Date("2026-12-05") },
    { name: "Ibuprofen 400mg", sku: "IBU-019", categoryName: "Obat Bebas Terbatas", purchasePrice: "8000", price: "12500", stock: "55", minStock: "10", unit: "strip", expiryDate: new Date("2027-08-18") },
    { name: "Simvastatin 10mg", sku: "SIM-020", categoryName: "Obat Keras (G)", purchasePrice: "20000", price: "28000", stock: "40", minStock: "10", unit: "strip", expiryDate: new Date("2026-11-22") },
    { name: "Mefenamic Acid 500mg", sku: "MEF-021", categoryName: "Obat Keras (G)", purchasePrice: "5000", price: "10000", stock: "100", minStock: "20", unit: "strip", expiryDate: new Date("2027-03-15") },
    { name: "Amlodipine 5mg", sku: "AML-022", categoryName: "Obat Keras (G)", purchasePrice: "15000", price: "22000", stock: "60", minStock: "15", unit: "strip", expiryDate: new Date("2027-09-10") },
    { name: "Metformin 500mg", sku: "MET-023", categoryName: "Obat Keras (G)", purchasePrice: "12000", price: "18000", stock: "80", minStock: "20", unit: "strip", expiryDate: new Date("2026-12-01") },
    { name: "Omeprazole 20mg", sku: "OME-024", categoryName: "Obat Keras (G)", purchasePrice: "25000", price: "35000", stock: "45", minStock: "10", unit: "strip", expiryDate: new Date("2027-01-20") },
    { name: "Lansoprazole 30mg", sku: "LAN-025", categoryName: "Obat Keras (G)", purchasePrice: "28000", price: "40000", stock: "30", minStock: "10", unit: "strip", expiryDate: new Date("2027-05-12") },
    { name: "Allopurinol 100mg", sku: "ALP-026", categoryName: "Obat Keras (G)", purchasePrice: "10000", price: "15000", stock: "50", minStock: "10", unit: "strip", expiryDate: new Date("2027-08-05") },
    { name: "Ranitidine 150mg", sku: "RAN-027", categoryName: "Obat Keras (G)", purchasePrice: "8000", price: "14000", stock: "40", minStock: "10", unit: "strip", expiryDate: new Date("2026-11-18") },
    { name: "Salep 88", sku: "SLP-028", categoryName: "Obat Bebas", purchasePrice: "5000", price: "8500", stock: "15", minStock: "5", unit: "pcs", expiryDate: new Date("2028-12-31") },
    { name: "Promag Tablet", sku: "PMG-029", categoryName: "Obat Bebas", purchasePrice: "7000", price: "10000", stock: "100", minStock: "20", unit: "strip", expiryDate: new Date("2028-06-20") },
    { name: "Enervon-C 30", sku: "ENV-030", categoryName: "Suplemen & Vitamin", purchasePrice: "35000", price: "48000", stock: "25", minStock: "5", unit: "botol", expiryDate: new Date("2027-10-15") },
    { name: "CDR Effervescent", sku: "CDR-031", categoryName: "Suplemen & Vitamin", purchasePrice: "45000", price: "60000", stock: "12", minStock: "5", unit: "tube", expiryDate: new Date("2027-11-11") },
    { name: "Vicks Formula 44", sku: "VIC-032", categoryName: "Obat Bebas Terbatas", purchasePrice: "15000", price: "22000", stock: "20", minStock: "5", unit: "botol", expiryDate: new Date("2027-04-30") },
    { name: "Komix Herbal", sku: "KMX-033", categoryName: "Obat Bebas", purchasePrice: "10000", price: "15000", stock: "50", minStock: "10", unit: "box", expiryDate: new Date("2027-09-22") },
    { name: "Degirol Tablet", sku: "DEG-034", categoryName: "Obat Bebas", purchasePrice: "8000", price: "12000", stock: "40", minStock: "10", unit: "strip", expiryDate: new Date("2027-02-10") },
    { name: "Bodrex", sku: "BDX-035", categoryName: "Obat Bebas", purchasePrice: "4000", price: "6500", stock: "150", minStock: "30", unit: "strip", expiryDate: new Date("2028-01-05") },
    { name: "Minyak Kayu Putih 60ml", sku: "MKP-036", categoryName: "Obat Bebas", purchasePrice: "18000", price: "25000", stock: "30", minStock: "10", unit: "botol", expiryDate: null },
    { name: "Counterpain 30g", sku: "CPN-037", categoryName: "Obat Bebas", purchasePrice: "40000", price: "55000", stock: "15", minStock: "5", unit: "tube", expiryDate: new Date("2027-07-20") },
    { name: "Oralit", sku: "ORL-038", categoryName: "Obat Bebas", purchasePrice: "500", price: "1500", stock: "200", minStock: "50", unit: "sachet", expiryDate: new Date("2028-11-11") },
    { name: "Hydrocortisone 1%", sku: "HYD-039", categoryName: "Obat Bebas Terbatas", purchasePrice: "10000", price: "16000", stock: "25", minStock: "5", unit: "tube", expiryDate: new Date("2027-05-30") },
    { name: "Cefadroxil 500mg", sku: "CEF-040", categoryName: "Obat Keras (G)", purchasePrice: "25000", price: "38000", stock: "20", minStock: "5", unit: "strip", expiryDate: new Date("2026-10-15") },
    { name: "Domperidone 10mg", sku: "DOM-041", categoryName: "Obat Keras (G)", purchasePrice: "15000", price: "22000", stock: "40", minStock: "10", unit: "strip", expiryDate: new Date("2027-01-10") },
    { name: "Loratadine 10mg", sku: "LOR-042", categoryName: "Obat Bebas Terbatas", purchasePrice: "12000", price: "18000", stock: "50", minStock: "10", unit: "strip", expiryDate: new Date("2027-06-25") },
    { name: "Spironolactone 25mg", sku: "SPI-043", categoryName: "Obat Keras (G)", purchasePrice: "30000", price: "42000", stock: "30", minStock: "5", unit: "strip", expiryDate: new Date("2026-12-20") },
    { name: "Glimepiride 2mg", sku: "GLI-044", categoryName: "Obat Keras (G)", purchasePrice: "28000", price: "38000", stock: "45", minStock: "10", unit: "strip", expiryDate: new Date("2027-02-15") },
    { name: "Bisoprolol 5mg", sku: "BIS-045", categoryName: "Obat Keras (G)", purchasePrice: "35000", price: "48000", stock: "25", minStock: "5", unit: "strip", expiryDate: new Date("2027-04-10") },
    { name: "Candesartan 8mg", sku: "CAN-046", categoryName: "Obat Keras (G)", purchasePrice: "40000", price: "55000", stock: "20", minStock: "5", unit: "strip", expiryDate: new Date("2027-08-30") },
    { name: "Nebulizer Kit", sku: "NEB-047", categoryName: "Alat Kesehatan", purchasePrice: "85000", price: "120000", stock: "5", minStock: "2", unit: "set", expiryDate: null },
    { name: "Tensimeter Digital", sku: "TNS-048", categoryName: "Alat Kesehatan", purchasePrice: "350000", price: "450000", stock: "3", minStock: "1", unit: "pcs", expiryDate: null },
    { name: "Kasa Steril", sku: "KAS-049", categoryName: "Alat Kesehatan", purchasePrice: "10000", price: "15000", stock: "50", minStock: "10", unit: "box", expiryDate: null },
    { name: "Alcohol Swabs", sku: "ALC-050", categoryName: "Alat Kesehatan", purchasePrice: "25000", price: "35000", stock: "100", minStock: "20", unit: "box", expiryDate: new Date("2028-10-10") },
  ]

  const insertedMedicines = await db.insert(medicines).values(
    seedMedicinesData.map(med => ({
      name: med.name,
      code: med.sku, // Use SKU as code for seed data
      sku: med.sku,
      categoryId: catMap[med.categoryName] || "", // Pastikan string tidak kosong
      organizationId: org!.id,
      purchasePrice: med.purchasePrice,
      price: med.price,
      stock: med.stock,
      minStock: med.minStock,
      unit: med.unit,
      expiryDate: med.expiryDate,
    }))
  ).returning()

  // 7. Seed Histori Stok (Stock Movements)
  console.log("📦 Menyiapkan Histori Stok (Initial In, Out, & Adjustments)...")
  
  // Gunakan tipe data eksplisit untuk insert stockMovements
  const initialMovements = insertedMedicines.map(med => ({
    medicineId: med.id,
    organizationId: org!.id,
    userId: demoUser!.id,
    type: "in",
    quantity: med.stock,
    note: "Stok awal (Seeding)",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }))

  const extraMovements: any[] = []
  const randomMeds = insertedMedicines.slice(0, 15)
  randomMeds.forEach((med, index) => {
    if (index % 3 === 0) {
      extraMovements.push({
        medicineId: med.id,
        organizationId: org!.id,
        userId: demoUser!.id,
        type: "out",
        quantity: "5.00",
        note: "Barang rusak / dibuang",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      })
    } else if (index % 2 === 0) {
      extraMovements.push({
        medicineId: med.id,
        organizationId: org!.id,
        userId: demoUser!.id,
        type: "adjustment",
        quantity: "2.00",
        note: "Koreksi Stok Opname (Selisih +)",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      })
    }
  })

  await db.insert(stockMovements).values([...initialMovements, ...extraMovements])

  console.log("✅ SEEDING SELESAI! Akun demo sekarang mendukung multi-cabang & detail apotek.")
  process.exit(0)
}

main().catch((err) => {
  console.error("❌ GAGAL SEEDING:", err)
  process.exit(1)
})
