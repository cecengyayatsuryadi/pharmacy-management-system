import { pgEnum, pgTable, text, timestamp, uuid, varchar, uniqueIndex, index, numeric, integer, boolean } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

/**
 * --- CORE & AUTH DOMAIN ---
 * Mengatur organisasi (tenant), user, dan hak akses.
 */

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  plan: varchar("plan", { length: 50 }).notNull().default("gratis"), // 'gratis' | 'pro'
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  logo: text("logo"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("staff"), // 'admin' | 'staff'
  status: varchar("status", { length: 50 }).notNull().default("active"), // 'active' | 'inactive'
  phone: varchar("phone", { length: 50 }),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  role: varchar("role", { length: 50 }).notNull().default("staff"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userOrgIndex: uniqueIndex("user_org_idx").on(table.userId, table.organizationId),
}))

/**
 * --- MASTER DATA DOMAIN ---
 * Data referensi utama untuk operasional apotek.
 */

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 50 }).notNull().default("#3b82f6"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  orgIdx: index("category_org_idx").on(table.organizationId),
}))

export const medicineGroups = pgTable("medicine_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 50 }).notNull().default("#3b82f6"), // Default blue-500
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  orgIdx: index("medicine_group_org_idx").on(table.organizationId),
}))

export const units = pgTable("units", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: varchar("name", { length: 50 }).notNull(),
  abbreviation: varchar("abbreviation", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("unit_org_idx").on(table.organizationId),
}))

export const warehouses = pgTable("warehouses", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  warehouseCodeOrgIndex: uniqueIndex("warehouse_code_org_idx").on(table.organizationId, table.code),
}))

export const medicines = pgTable("medicines", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  groupId: uuid("group_id")
    .references(() => medicineGroups.id),
  baseUnitId: uuid("base_unit_id")
    .notNull()
    .references(() => units.id),
  
  // Identitas
  code: varchar("code", { length: 50 }).notNull(), // Auto-gen MED-XXXXX
  name: varchar("name", { length: 255 }).notNull(),
  genericName: varchar("generic_name", { length: 255 }),
  sku: varchar("sku", { length: 100 }), // Barcode
  classification: varchar("classification", { length: 100 }).notNull().default("Bebas"), // Golongan
  
  // Finansial & Stok
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }).notNull().default("0"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  stock: numeric("stock", { precision: 12, scale: 2 }).notNull().default("0"), // Cache balance
  minStock: numeric("min_stock", { precision: 12, scale: 2 }).notNull().default("0"),
  maxStock: numeric("max_stock", { precision: 12, scale: 2 }).notNull().default("0"),
  
  // Medis & Detail
  description: text("description"),
  composition: text("composition"),
  indication: text("indication"),
  contraindication: text("contraindication"),
  sideEffects: text("side_effects"),
  manufacturer: varchar("manufacturer", { length: 255 }),
  distributor: varchar("distributor", { length: 255 }),
  image: text("image"),
  isActive: boolean("is_active").notNull().default(true),
  
  // Legacy fields for migration support
  unit: varchar("unit", { length: 50 }), 
  expiryDate: timestamp("expiry_date"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  skuOrgIndex: uniqueIndex("sku_org_idx").on(table.organizationId, table.sku),
  codeOrgIndex: uniqueIndex("medicine_code_org_idx").on(table.organizationId, table.code),
  orgCategoryIdx: index("medicine_org_category_idx").on(table.organizationId, table.categoryId),
  orgGroupIdx: index("medicine_org_group_idx").on(table.organizationId, table.groupId),
  orgActiveIdx: index("medicine_org_active_idx").on(table.organizationId, table.isActive),
  orgCreatedIdx: index("medicine_org_created_idx").on(table.organizationId, table.createdAt),
}))

export const medicineFormularies = pgTable("medicine_formularies", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  medicineId: uuid("medicine_id")
    .notNull()
    .references(() => medicines.id),
  type: varchar("type", { length: 100 }).notNull(), // 'Fornas', 'RS', dll.
  status: boolean("status").notNull().default(true),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  formularyUniqueIdx: uniqueIndex("formulary_unique_idx").on(table.organizationId, table.medicineId, table.type),
  orgMedicineIdx: index("formulary_org_medicine_idx").on(table.organizationId, table.medicineId),
  orgTypeIdx: index("formulary_org_type_idx").on(table.organizationId, table.type),
}))

export const medicineSubstitutions = pgTable("medicine_substitutions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  medicineId: uuid("medicine_id")
    .notNull()
    .references(() => medicines.id),
  substituteMedicineId: uuid("substitute_medicine_id")
    .notNull()
    .references(() => medicines.id),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  substitutionUniqueIdx: uniqueIndex("substitution_unique_idx").on(table.organizationId, table.medicineId, table.substituteMedicineId),
  orgMedicineIdx: index("substitution_org_medicine_idx").on(table.organizationId, table.medicineId),
  orgSubMedicineIdx: index("substitution_org_sub_medicine_idx").on(table.organizationId, table.substituteMedicineId),
}))

/**
 * --- INVENTORY DOMAIN ---
 * Mengelola stok fisik, batch, dan pergerakan barang.
 */

export const medicineBatches = pgTable("medicine_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  medicineId: uuid("medicine_id")
    .notNull()
    .references(() => medicines.id),
  batchNumber: varchar("batch_number", { length: 100 }).notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  batchUniqueIdx: uniqueIndex("batch_unique_idx").on(table.organizationId, table.medicineId, table.batchNumber),
}))

export const stockItems = pgTable("stock_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  medicineId: uuid("medicine_id")
    .notNull()
    .references(() => medicines.id),
  batchId: uuid("batch_id")
    .references(() => medicineBatches.id),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull().default("0"),
  reservedQuantity: numeric("reserved_quantity", { precision: 12, scale: 2 }).notNull().default("0"),
  quarantineQuantity: numeric("quarantine_quantity", { precision: 12, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  stockItemUniqueIdx: uniqueIndex("stock_item_unique_idx").on(table.organizationId, table.warehouseId, table.medicineId, table.batchId),
}))

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  medicineId: uuid("medicine_id")
    .notNull()
    .references(() => medicines.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  warehouseId: uuid("warehouse_id").references(() => warehouses.id),
  batchId: uuid("batch_id").references(() => medicineBatches.id),
  supplierId: uuid("supplier_id"), // Relasi ke suppliers (nanti)
  purchaseId: uuid("purchase_id"), // Relasi ke purchases (nanti)
  
  type: varchar("type", { length: 50 }).notNull(), // 'in', 'out', 'adjustment', 'transfer_in', 'transfer_out'
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  priceAtTransaction: numeric("price_at_transaction", { precision: 12, scale: 2 }).notNull().default("0"),
  balanceBefore: numeric("balance_before", { precision: 12, scale: 2 }).notNull().default("0"),
  resultingStock: numeric("resulting_stock", { precision: 12, scale: 2 }).notNull().default("0"),
  reference: varchar("reference", { length: 255 }),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const unitConversions = pgTable("unit_conversions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  medicineId: uuid("medicine_id")
    .notNull()
    .references(() => medicines.id),
  fromUnitId: uuid("from_unit_id")
    .notNull()
    .references(() => units.id),
  toUnitId: uuid("to_unit_id")
    .notNull()
    .references(() => units.id),
  factor: numeric("factor", { precision: 12, scale: 4 }).notNull(), // e.g., 1 Box = 10 Strip
}, (table) => ({
  conversionUniqueIdx: uniqueIndex("unit_conversion_unique_idx").on(table.organizationId, table.medicineId, table.fromUnitId, table.toUnitId),
}))

export const stockTransfers = pgTable("stock_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  fromWarehouseId: uuid("from_warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  toWarehouseId: uuid("to_warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  medicineId: uuid("medicine_id")
    .notNull()
    .references(() => medicines.id),
  batchId: uuid("batch_id").references(() => medicineBatches.id),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * --- PROCUREMENT DOMAIN ---
 * Manajemen supplier dan pembelian stok.
 */

export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  contactPerson: varchar("contact_person", { length: 255 }),
  leadTimeDays: integer("lead_time_days").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  supplierCodeOrgIndex: uniqueIndex("supplier_code_org_idx").on(table.organizationId, table.code),
}))

export const supplierMedicines = pgTable("supplier_medicines", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id),
  medicineId: uuid("medicine_id")
    .notNull()
    .references(() => medicines.id),
  supplierSku: varchar("supplier_sku", { length: 100 }),
  lastPurchasePrice: numeric("last_purchase_price", { precision: 12, scale: 2 }),
  leadTimeDays: integer("lead_time_days"),
  isPrimary: boolean("is_primary").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  supplierMedicineOrgIdx: uniqueIndex("supplier_medicine_org_idx").on(table.organizationId, table.supplierId, table.medicineId),
}))

export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  purchaseNumber: varchar("purchase_number", { length: 100 }).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  purchaseNumberOrgIndex: uniqueIndex("purchase_number_org_idx").on(table.organizationId, table.purchaseNumber),
}))

export const purchaseItems = pgTable("purchase_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseId: uuid("purchase_id")
    .notNull()
    .references(() => purchases.id),
  medicineId: uuid("medicine_id")
    .notNull()
    .references(() => medicines.id),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
})

/**
 * --- SALES DOMAIN ---
 * Point of Sale (POS) dan riwayat penjualan.
 */

export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  changeAmount: numeric("change_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull().default("cash"),
  customerName: varchar("customer_name", { length: 255 }),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  invoiceOrgIndex: uniqueIndex("invoice_org_idx").on(table.organizationId, table.invoiceNumber),
}))

export const saleItems = pgTable("sale_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleId: uuid("sale_id")
    .notNull()
    .references(() => sales.id),
  medicineId: uuid("medicine_id")
    .notNull()
    .references(() => medicines.id),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  purchasePriceAtSale: numeric("purchase_price_at_sale", { precision: 12, scale: 2 }).notNull().default("0"),
  priceAtSale: numeric("price_at_sale", { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
})

/**
 * --- RELATIONS ---
 */

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  categories: many(categories),
  medicineGroups: many(medicineGroups),
  suppliers: many(suppliers),
  medicines: many(medicines),
  memberships: many(memberships),
  warehouses: many(warehouses),
  units: many(units),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  memberships: many(memberships),
}))

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
}))

export const categoriesRelations = relations(categories, ({ one }) => ({
  organization: one(organizations, {
    fields: [categories.organizationId],
    references: [organizations.id],
  }),
}))

export const medicineGroupsRelations = relations(medicineGroups, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [medicineGroups.organizationId],
    references: [organizations.id],
  }),
  medicines: many(medicines),
}))

export const unitsRelations = relations(units, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [units.organizationId],
    references: [organizations.id],
  }),
  medicines: many(medicines),
  conversionsFrom: many(unitConversions, { relationName: "fromUnit" }),
  conversionsTo: many(unitConversions, { relationName: "toUnit" }),
}))

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [warehouses.organizationId],
    references: [organizations.id],
  }),
  stockItems: many(stockItems),
}))

export const medicinesRelations = relations(medicines, ({ one, many }) => ({
  organization: one(organizations, { fields: [medicines.organizationId], references: [organizations.id] }),
  category: one(categories, { fields: [medicines.categoryId], references: [categories.id] }),
  group: one(medicineGroups, { fields: [medicines.groupId], references: [medicineGroups.id] }),
  baseUnit: one(units, { fields: [medicines.baseUnitId], references: [units.id] }),
  batches: many(medicineBatches),
  stockItems: many(stockItems),
  stockMovements: many(stockMovements),
  unitConversions: many(unitConversions),
  formularies: many(medicineFormularies),
  substitutions: many(medicineSubstitutions, { relationName: "medicine" }),
  asSubstitute: many(medicineSubstitutions, { relationName: "substitute" }),
}))

export const medicineFormulariesRelations = relations(medicineFormularies, ({ one }) => ({
  organization: one(organizations, {
    fields: [medicineFormularies.organizationId],
    references: [organizations.id],
  }),
  medicine: one(medicines, {
    fields: [medicineFormularies.medicineId],
    references: [medicines.id],
  }),
}))

export const medicineSubstitutionsRelations = relations(medicineSubstitutions, ({ one }) => ({
  organization: one(organizations, {
    fields: [medicineSubstitutions.organizationId],
    references: [organizations.id],
  }),
  medicine: one(medicines, {
    fields: [medicineSubstitutions.medicineId],
    references: [medicines.id],
    relationName: "medicine",
  }),
  substituteMedicine: one(medicines, {
    fields: [medicineSubstitutions.substituteMedicineId],
    references: [medicines.id],
    relationName: "substitute",
  }),
}))

export const medicineBatchesRelations = relations(medicineBatches, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [medicineBatches.organizationId],
    references: [organizations.id],
  }),
  medicine: one(medicines, {
    fields: [medicineBatches.medicineId],
    references: [medicines.id],
  }),
  stockItems: many(stockItems),
  stockMovements: many(stockMovements),
}))

export const stockItemsRelations = relations(stockItems, ({ one }) => ({
  organization: one(organizations, {
    fields: [stockItems.organizationId],
    references: [organizations.id],
  }),
  warehouse: one(warehouses, {
    fields: [stockItems.warehouseId],
    references: [warehouses.id],
  }),
  medicine: one(medicines, {
    fields: [stockItems.medicineId],
    references: [medicines.id],
  }),
  batch: one(medicineBatches, {
    fields: [stockItems.batchId],
    references: [medicineBatches.id],
  }),
}))

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  organization: one(organizations, {
    fields: [stockMovements.organizationId],
    references: [organizations.id],
  }),
  medicine: one(medicines, { fields: [stockMovements.medicineId], references: [medicines.id] }),
  user: one(users, { fields: [stockMovements.userId], references: [users.id] }),
  warehouse: one(warehouses, { fields: [stockMovements.warehouseId], references: [warehouses.id] }),
  batch: one(medicineBatches, { fields: [stockMovements.batchId], references: [medicineBatches.id] }),
}))

export const unitConversionsRelations = relations(unitConversions, ({ one }) => ({
  organization: one(organizations, {
    fields: [unitConversions.organizationId],
    references: [organizations.id],
  }),
  medicine: one(medicines, {
    fields: [unitConversions.medicineId],
    references: [medicines.id],
  }),
  fromUnit: one(units, {
    fields: [unitConversions.fromUnitId],
    references: [units.id],
    relationName: "fromUnit",
  }),
  toUnit: one(units, {
    fields: [unitConversions.toUnitId],
    references: [units.id],
    relationName: "toUnit",
  }),
}))

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [suppliers.organizationId],
    references: [organizations.id],
  }),
  supplierMedicines: many(supplierMedicines),
  purchases: many(purchases),
}))

export const supplierMedicinesRelations = relations(supplierMedicines, ({ one }) => ({
  organization: one(organizations, {
    fields: [supplierMedicines.organizationId],
    references: [organizations.id],
  }),
  supplier: one(suppliers, {
    fields: [supplierMedicines.supplierId],
    references: [suppliers.id],
  }),
  medicine: one(medicines, {
    fields: [supplierMedicines.medicineId],
    references: [medicines.id],
  }),
}))

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [purchases.organizationId],
    references: [organizations.id],
  }),
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
  }),
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
  items: many(purchaseItems),
}))

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  medicine: one(medicines, {
    fields: [purchaseItems.medicineId],
    references: [medicines.id],
  }),
}))

export const salesRelations = relations(sales, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [sales.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
  items: many(saleItems),
}))

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  medicine: one(medicines, {
    fields: [saleItems.medicineId],
    references: [medicines.id],
  }),
}))

// (Tambahan relasi lain sesuai kebutuhan...)


// --- PRESCRIPTIONS (RESEP DIGITAL) ---

export const prescriptionStatusEnum = pgEnum("prescription_status", ["PENDING", "COMPLETED", "CANCELLED"])

export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  userId: uuid("user_id") // pharmacist/staff who created it
    .notNull()
    .references(() => users.id),
  saleId: uuid("sale_id").references(() => sales.id), // Link to sale transaction if checked out
  prescriptionNumber: varchar("prescription_number", { length: 100 }).notNull(),
  doctorName: varchar("doctor_name", { length: 255 }).notNull(),
  patientName: varchar("patient_name", { length: 255 }).notNull(),
  patientAge: integer("patient_age"),
  patientAddress: text("patient_address"),
  patientPhone: varchar("patient_phone", { length: 50 }),
  notes: text("notes"), // Signa / instructions
  status: prescriptionStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const prescriptionItems = pgTable("prescription_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  prescriptionId: uuid("prescription_id")
    .notNull()
    .references(() => prescriptions.id),
  // If it's a standard medicine, medicineId is set. If it's a compound (racikan), it's null.
  medicineId: uuid("medicine_id").references(() => medicines.id),
  isCompounded: boolean("is_compounded").notNull().default(false),
  compoundedName: varchar("compounded_name", { length: 255 }), // e.g. "Puyer Batuk Anak"
  compoundingFee: numeric("compounding_fee", { precision: 12, scale: 2 }).notNull().default("0"),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(), // Number of packages/pills
  instructions: text("instructions"), // e.g., "3 x 1 sesudah makan"
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull().default("0"),
})

export const prescriptionItemComponents = pgTable("prescription_item_components", {
  id: uuid("id").primaryKey().defaultRandom(),
  prescriptionItemId: uuid("prescription_item_id")
    .notNull()
    .references(() => prescriptionItems.id),
  medicineId: uuid("medicine_id")
    .notNull()
    .references(() => medicines.id),
  quantityPerPackage: numeric("quantity_per_package", { precision: 12, scale: 2 }).notNull(), // e.g., 0.5 tablet
  totalQuantity: numeric("total_quantity", { precision: 12, scale: 2 }).notNull(), // quantityPerPackage * itemQuantity
  priceAtPrescription: numeric("price_at_prescription", { precision: 12, scale: 2 }).notNull(),
})


export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [prescriptions.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [prescriptions.userId],
    references: [users.id],
  }),
  sale: one(sales, {
    fields: [prescriptions.saleId],
    references: [sales.id],
  }),
  items: many(prescriptionItems),
}))

export const prescriptionItemsRelations = relations(prescriptionItems, ({ one, many }) => ({
  prescription: one(prescriptions, {
    fields: [prescriptionItems.prescriptionId],
    references: [prescriptions.id],
  }),
  medicine: one(medicines, {
    fields: [prescriptionItems.medicineId],
    references: [medicines.id],
  }),
  components: many(prescriptionItemComponents),
}))

export const prescriptionItemComponentsRelations = relations(prescriptionItemComponents, ({ one }) => ({
  prescriptionItem: one(prescriptionItems, {
    fields: [prescriptionItemComponents.prescriptionItemId],
    references: [prescriptionItems.id],
  }),
  medicine: one(medicines, {
    fields: [prescriptionItemComponents.medicineId],
    references: [medicines.id],
  }),
}))


// --- RETURNS (RETUR OBAT) ---

export const saleReturnStatusEnum = pgEnum("sale_return_status", ["PENDING", "COMPLETED", "REJECTED"])

export const saleReturns = pgTable("sale_returns", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  userId: uuid("user_id") // staff who processed it
    .notNull()
    .references(() => users.id),
  saleId: uuid("sale_id")
    .notNull()
    .references(() => sales.id),
  returnNumber: varchar("return_number", { length: 100 }).notNull(),
  reason: text("reason").notNull(),
  status: saleReturnStatusEnum("status").notNull().default("COMPLETED"),
  totalRefundAmount: numeric("total_refund_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const saleReturnItems = pgTable("sale_return_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleReturnId: uuid("sale_return_id")
    .notNull()
    .references(() => saleReturns.id),
  saleItemId: uuid("sale_item_id")
    .notNull()
    .references(() => saleItems.id),
  medicineId: uuid("medicine_id")
    .notNull()
    .references(() => medicines.id),
  quantityReturned: numeric("quantity_returned", { precision: 12, scale: 2 }).notNull(),
  refundAmount: numeric("refund_amount", { precision: 12, scale: 2 }).notNull(),
})


export const saleReturnsRelations = relations(saleReturns, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [saleReturns.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [saleReturns.userId],
    references: [users.id],
  }),
  sale: one(sales, {
    fields: [saleReturns.saleId],
    references: [sales.id],
  }),
  items: many(saleReturnItems),
}))

export const saleReturnItemsRelations = relations(saleReturnItems, ({ one }) => ({
  saleReturn: one(saleReturns, {
    fields: [saleReturnItems.saleReturnId],
    references: [saleReturns.id],
  }),
  saleItem: one(saleItems, {
    fields: [saleReturnItems.saleItemId],
    references: [saleItems.id],
  }),
  medicine: one(medicines, {
    fields: [saleReturnItems.medicineId],
    references: [medicines.id],
  }),
}))

export type Organization = typeof organizations.$inferSelect
export type User = typeof users.$inferSelect
export type Category = typeof categories.$inferSelect
export type MedicineGroup = typeof medicineGroups.$inferSelect
export type Unit = typeof units.$inferSelect
export type Warehouse = typeof warehouses.$inferSelect
export type Medicine = typeof medicines.$inferSelect
export type MedicineBatch = typeof medicineBatches.$inferSelect
export type StockItem = typeof stockItems.$inferSelect
export type StockMovement = typeof stockMovements.$inferSelect
export type Supplier = typeof suppliers.$inferSelect
export type Purchase = typeof purchases.$inferSelect
export type Sale = typeof sales.$inferSelect
export type SaleItem = typeof saleItems.$inferSelect
export type MedicineFormulary = typeof medicineFormularies.$inferSelect
export type MedicineSubstitution = typeof medicineSubstitutions.$inferSelect

export type NewMedicine = typeof medicines.$inferInsert
export type NewStockMovement = typeof stockMovements.$inferInsert
export type NewCategory = typeof categories.$inferInsert
export type NewMedicineGroup = typeof medicineGroups.$inferInsert
export type NewSupplier = typeof suppliers.$inferInsert
export type NewPurchase = typeof purchases.$inferInsert
export type NewPurchaseItem = typeof purchaseItems.$inferInsert
export type NewSale = typeof sales.$inferInsert
export type NewSaleItem = typeof saleItems.$inferInsert
export type NewMedicineFormulary = typeof medicineFormularies.$inferInsert
export type NewMedicineSubstitution = typeof medicineSubstitutions.$inferInsert
export type UnitConversion = typeof unitConversions.$inferSelect
export type SaleReturn = typeof saleReturns.$inferSelect
export type SaleReturnItem = typeof saleReturnItems.$inferSelect
export type NewSaleReturn = typeof saleReturns.$inferInsert
export type NewSaleReturnItem = typeof saleReturnItems.$inferInsert

export type Prescription = typeof prescriptions.$inferSelect
export type PrescriptionItem = typeof prescriptionItems.$inferSelect
export type PrescriptionItemComponent = typeof prescriptionItemComponents.$inferSelect
export type NewPrescription = typeof prescriptions.$inferInsert
export type NewPrescriptionItem = typeof prescriptionItems.$inferInsert
export type NewPrescriptionItemComponent = typeof prescriptionItemComponents.$inferInsert
