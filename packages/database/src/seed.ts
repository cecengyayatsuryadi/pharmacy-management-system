import { db, organizations, categories, medicines, users, stockMovements, memberships, units, warehouses } from "./index"
import { eq, and, or } from "drizzle-orm"
import bcrypt from "bcryptjs"

async function main() {
  console.log("🌱 Memulai Seeding Final (9 Golongan & 10 Kategori Standard Indonesia)...")

  const DEMO_EMAIL = "demo@google.com"
  const DEMO_PASS = "demo123"
  const ORG_NAME = "Apotek Demo Indonesia"

  // 1. Setup Organisasi & User
  let org = await db.query.organizations.findFirst({ where: eq(organizations.name, ORG_NAME) })
  if (!org) {
    const [newOrg] = await db.insert(organizations).values({
      name: ORG_NAME,
      slug: "apotek-demo-id",
      plan: "pro",
      address: "Pusat Farmasi Nasional, Jakarta",
      phone: "021-5550123",
    }).returning()
    org = newOrg
  }

  let demoUser = await db.query.users.findFirst({ where: eq(users.email, DEMO_EMAIL) })
  if (!demoUser) {
    const hashedPassword = await bcrypt.hash(DEMO_PASS, 10)
    const [newUser] = await db.insert(users).values({
      name: "Apoteker Demo",
      email: DEMO_EMAIL,
      password: hashedPassword,
      organizationId: org!.id,
      role: "admin",
      status: "active"
    }).returning()
    demoUser = newUser
  }

  const existingMembership = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, demoUser!.id), eq(memberships.organizationId, org!.id))
  })
  if (!existingMembership) {
    await db.insert(memberships).values({ userId: demoUser!.id, organizationId: org!.id, role: "admin" })
  }

  // 4. Seed Satuan Dasar
  console.log("📏 Menyiapkan Satuan Dasar...")
  const seedUnits = [
    { name: "Tablet", abbreviation: "TBL" }, { name: "Strip", abbreviation: "STP" },
    { name: "Botol", abbreviation: "BTL" }, { name: "Box", abbreviation: "BOX" },
    { name: "Pcs", abbreviation: "PCS" }, { name: "Tube", abbreviation: "TBE" },
    { name: "Sachet", abbreviation: "SCH" }, { name: "Kapsul", abbreviation: "KPS" },
    { name: "Ampul", abbreviation: "AMP" }, { name: "Vial", abbreviation: "VIL" },
  ]
  for (const u of seedUnits) {
    const existing = await db.query.units.findFirst({
      where: and(eq(units.organizationId, org!.id), eq(units.name, u.name))
    })
    if (!existing) await db.insert(units).values({ ...u, organizationId: org!.id })
  }
  const allUnits = await db.query.units.findMany({ where: eq(units.organizationId, org!.id) })
  const unitMap = Object.fromEntries(allUnits.map(u => [u.name, u.id]))

  let warehouse = await db.query.warehouses.findFirst({ where: eq(warehouses.organizationId, org!.id) })
  if (!warehouse) {
    const [newWh] = await db.insert(warehouses).values({
      organizationId: org!.id, code: "G-01", name: "Gudang Utama", isActive: true
    }).returning()
    warehouse = newWh
  }

  // 5. Clear old data
  console.log("🧹 Membersihkan data lama...")
  const { supplierMedicines, stockMovements: sm, medicines: med, categories: cat, medicineGroups: grp, unitConversions } = await import("./index")
  await db.delete(supplierMedicines).where(eq(supplierMedicines.organizationId, org!.id))
  await db.delete(sm).where(eq(sm.organizationId, org!.id))
  await db.delete(unitConversions).where(eq(unitConversions.organizationId, org!.id))
  await db.delete(med).where(eq(med.organizationId, org!.id))
  await db.delete(grp).where(eq(grp.organizationId, org!.id))
  await db.delete(cat).where(eq(cat.organizationId, org!.id))
  
  // 6. Seed 10 Kategori Klinis
  console.log("📦 Menyiapkan 10 Kategori Klinis...")
  const seedCategories = [
    { name: "Saluran Pencernaan", color: "#10b981", description: "Obat lambung, maag, diare" },
    { name: "Sistem Kardiovaskular", color: "#ef4444", description: "Jantung & Hipertensi" },
    { name: "Sistem Pernapasan", color: "#3b82f6", description: "Batuk, Pilek, Asma" },
    { name: "Sistem Saraf Pusat", color: "#8b5cf6", description: "Pereda nyeri, penenang" },
    { name: "Endokrin & Metabolik", color: "#f59e0b", description: "Diabetes, Kolesterol" },
    { name: "Anti Infeksi (Sistemik)", color: "#ec4899", description: "Antibiotik, Anti-jamur" },
    { name: "Otot & Sendi", color: "#6366f1", description: "Rematik, Nyeri otot" },
    { name: "Obat Luar (Topikal)", color: "#f43f5e", description: "Salep, Krim, Tetes" },
    { name: "Vitamin & Suplemen", color: "#84cc16", description: "Kesehatan harian" },
    { name: "Alat Kesehatan", color: "#6b7280", description: "Masker, Spuit, dll" },
  ]
  const insertedCats = await db.insert(categories).values(seedCategories.map(c => ({ ...c, organizationId: org!.id }))).returning()
  const catMap = Object.fromEntries(insertedCats.map(c => [c.name, c.id]))

  // 6.5 Seed 9 Golongan Regulasi
  console.log("🏷️ Menyiapkan 9 Golongan Regulasi (BPOM)...")
  const seedGroups = [
    { name: "Obat Bebas", color: "#22c55e", description: "Lingkaran Hijau" },
    { name: "Obat Bebas Terbatas", color: "#3b82f6", description: "Lingkaran Biru" },
    { name: "Obat Keras", color: "#ef4444", description: "Lingkaran Merah Huruf K" },
    { name: "Psikotropika", color: "#a855f7", description: "Obat Keras Tertentu" },
    { name: "Narkotika", color: "#1f2937", description: "Palang Medali Merah" },
    { name: "Prekursor", color: "#ea580c", description: "Obat Flu & Batuk tertentu" },
    { name: "Jamu", color: "#15803d", description: "Logo Pohon Hijau" },
    { name: "OHT", color: "#047857", description: "Obat Herbal Terstandar (3 Bintang)" },
    { name: "Fitofarmaka", color: "#065f46", description: "Herbal Klinis (Kristal Es)" },
  ]
  const insertedGroups = await db.insert(grp).values(seedGroups.map(g => ({ ...g, organizationId: org!.id }))).returning()
  const groupMap = Object.fromEntries(insertedGroups.map(g => [g.name, g.id]))

  // 7. Seed Medicines
  console.log("💊 Menyiapkan Data Obat Representatif...")
  const meds = [
    { name: "Antasida Doen", generic: "Al(OH)3", cat: "Saluran Pencernaan", grp: "Obat Bebas", unit: "Tablet", price: "500", purchase: "200", stock: 500 },
    { name: "Amlodipine 5mg", generic: "Amlodipine", cat: "Sistem Kardiovaskular", grp: "Obat Keras", unit: "Tablet", price: "1500", purchase: "800", stock: 300 },
    { name: "Rhinos SR", generic: "Loratadine", cat: "Sistem Pernapasan", grp: "Prekursor", unit: "Kapsul", price: "15000", purchase: "11000", stock: 60 },
    { name: "Xanax 0.5mg", generic: "Alprazolam", cat: "Sistem Saraf Pusat", grp: "Psikotropika", unit: "Tablet", price: "15000", purchase: "8000", stock: 20 },
    { name: "Tolak Angin", generic: "Herbal", cat: "Vitamin & Suplemen", grp: "Jamu", unit: "Sachet", price: "4500", purchase: "3200", stock: 240 },
    { name: "Stimuno Forte", generic: "Phyllanthus", cat: "Vitamin & Suplemen", grp: "Fitofarmaka", unit: "Strip", price: "35000", purchase: "28000", stock: 30 },
    { name: "Betadine Salep", generic: "Povidone", cat: "Obat Luar (Topikal)", grp: "Obat Bebas", unit: "Tube", price: "18000", purchase: "14000", stock: 50 },
  ]

  const insertedMeds = await db.insert(medicines).values(meds.map((m, i) => ({
    organizationId: org!.id,
    categoryId: catMap[m.cat] || insertedCats[0].id,
    groupId: groupMap[m.grp] || null,
    baseUnitId: unitMap[m.unit] || allUnits[0].id,
    code: `MED-${(i + 1).toString().padStart(5, '0')}`,
    name: m.name,
    genericName: m.generic,
    classification: m.grp,
    purchasePrice: m.purchase,
    price: m.price,
    stock: m.stock.toString(),
    minStock: "10",
    unit: m.unit.toLowerCase(),
  }))).returning()

  console.log("✅ SEEDING FINAL SELESAI (9 Golongan & 10 Kategori)!");
  process.exit(0)
}

main().catch(err => { console.error("❌ GAGAL SEEDING:", err); process.exit(1) })
