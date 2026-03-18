import { db } from "./index"
import { sql } from "drizzle-orm"

async function main() {
  console.log("🧨 Menghancurkan seluruh tabel untuk reset skema...")
  
  try {
    await db.execute(sql`
      DROP TABLE IF EXISTS "sale_items" CASCADE;
      DROP TABLE IF EXISTS "sales" CASCADE;
      DROP TABLE IF EXISTS "purchase_items" CASCADE;
      DROP TABLE IF EXISTS "purchases" CASCADE;
      DROP TABLE IF EXISTS "supplier_medicines" CASCADE;
      DROP TABLE IF EXISTS "suppliers" CASCADE;
      DROP TABLE IF EXISTS "stock_transfers" CASCADE;
      DROP TABLE IF EXISTS "unit_conversions" CASCADE;
      DROP TABLE IF EXISTS "stock_movements" CASCADE;
      DROP TABLE IF EXISTS "stock_items" CASCADE;
      DROP TABLE IF EXISTS "medicine_batches" CASCADE;
      DROP TABLE IF EXISTS "medicines" CASCADE;
      DROP TABLE IF EXISTS "warehouses" CASCADE;
      DROP TABLE IF EXISTS "units" CASCADE;
      DROP TABLE IF EXISTS "categories" CASCADE;
      DROP TABLE IF EXISTS "memberships" CASCADE;
      DROP TABLE IF EXISTS "users" CASCADE;
      DROP TABLE IF EXISTS "organizations" CASCADE;
      DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE;
    `)
    console.log("✅ Database bersih! Silakan jalankan 'npm run db:push' sekarang.")
  } catch (error) {
    console.error("❌ Gagal membersihkan database:", error)
  }
  process.exit(0)
}

main()
