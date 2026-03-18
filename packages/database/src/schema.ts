import { pgTable, text, timestamp, uuid, varchar, uniqueIndex, numeric, integer, boolean } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

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

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  categories: many(categories),
  suppliers: many(suppliers),
  medicines: many(medicines),
  memberships: many(memberships),
}))

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id") // Default organization (fallback)
    .notNull()
    .references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("staff"), // 'admin' | 'staff'
  status: varchar("status", { length: 50 }).notNull().default("active"), // 'active' | 'inactive' | 'pending'
  phone: varchar("phone", { length: 50 }),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  memberships: many(memberships),
}))

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  role: varchar("role", { length: 50 }).notNull().default("staff"), // 'admin' | 'staff'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userOrgIndex: uniqueIndex("user_org_idx").on(table.userId, table.organizationId),
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

export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Membership = typeof memberships.$inferSelect
export type NewMembership = typeof memberships.$inferInsert

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const categoriesRelations = relations(categories, ({ one }) => ({
  organization: one(organizations, {
    fields: [categories.organizationId],
    references: [organizations.id],
  }),
}))

export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  phone: varchar("phone", { length: 50 }),
  contactPerson: varchar("contact_person", { length: 255 }),
  leadTimeDays: integer("lead_time_days").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  supplierOrgIndex: uniqueIndex("supplier_org_idx").on(table.organizationId, table.name),
  supplierCodeOrgIndex: uniqueIndex("supplier_code_org_idx").on(table.organizationId, table.code),
}))

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [suppliers.organizationId],
    references: [organizations.id],
  }),
  supplierMedicines: many(supplierMedicines),
  stockMovements: many(stockMovements),
  purchases: many(purchases),
}))

export const medicines = pgTable("medicines", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }).notNull().default("0"), // Harga Beli
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"), // Harga Jual
  stock: numeric("stock", { precision: 12, scale: 2 }).notNull().default("0"),
  minStock: numeric("min_stock", { precision: 12, scale: 2 }).notNull().default("0"), // Stok Minimum Alert
  unit: varchar("unit", { length: 50 }).notNull().default("pcs"), // tablet, botol, dll
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  // SKU unik hanya dalam satu organisasi
  skuOrgIndex: uniqueIndex("sku_org_idx").on(table.organizationId, table.sku),
}))

export const medicinesRelations = relations(medicines, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [medicines.organizationId],
    references: [organizations.id],
  }),
  category: one(categories, {
    fields: [medicines.categoryId],
    references: [categories.id],
  }),
  supplierMedicines: many(supplierMedicines),
  stockMovements: many(stockMovements),
  purchaseItems: many(purchaseItems),
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
  purchaseId: uuid("purchase_id").references(() => purchases.id),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  type: varchar("type", { length: 50 }).notNull(), // 'in', 'out', 'adjustment'
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  priceAtTransaction: numeric("price_at_transaction", { precision: 12, scale: 2 }).notNull().default("0"),
  resultingStock: numeric("resulting_stock", { precision: 12, scale: 2 }).notNull().default("0"),
  reference: varchar("reference", { length: 255 }), // No. Faktur / No. Resep
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  organization: one(organizations, {
    fields: [stockMovements.organizationId],
    references: [organizations.id],
  }),
  medicine: one(medicines, {
    fields: [stockMovements.medicineId],
    references: [medicines.id],
  }),
  user: one(users, {
    fields: [stockMovements.userId],
    references: [users.id],
  }),
  supplier: one(suppliers, {
    fields: [stockMovements.supplierId],
    references: [suppliers.id],
  }),
  purchase: one(purchases, {
    fields: [stockMovements.purchaseId],
    references: [purchases.id],
  }),
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
  purchaseInvoiceSupplierOrgIndex: uniqueIndex("purchase_invoice_supplier_org_idx").on(
    table.organizationId,
    table.supplierId,
    table.invoiceNumber
  ),
  purchaseNumberOrgIndex: uniqueIndex("purchase_number_org_idx").on(table.organizationId, table.purchaseNumber),
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
  stockMovements: many(stockMovements),
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
  supplierMedicineOrgIdx: uniqueIndex("supplier_medicine_org_idx").on(
    table.organizationId,
    table.supplierId,
    table.medicineId
  ),
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
  paymentMethod: varchar("payment_method", { length: 50 }).notNull().default("cash"), // 'cash', 'transfer', 'qris'
  customerName: varchar("customer_name", { length: 255 }),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  invoiceOrgIndex: uniqueIndex("invoice_org_idx").on(table.organizationId, table.invoiceNumber),
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

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Supplier = typeof suppliers.$inferSelect
export type NewSupplier = typeof suppliers.$inferInsert
export type Medicine = typeof medicines.$inferSelect
export type NewMedicine = typeof medicines.$inferInsert
export type StockMovement = typeof stockMovements.$inferSelect
export type NewStockMovement = typeof stockMovements.$inferInsert
export type Purchase = typeof purchases.$inferSelect
export type NewPurchase = typeof purchases.$inferInsert
export type PurchaseItem = typeof purchaseItems.$inferSelect
export type NewPurchaseItem = typeof purchaseItems.$inferInsert
export type SupplierMedicine = typeof supplierMedicines.$inferSelect
export type NewSupplierMedicine = typeof supplierMedicines.$inferInsert
export type Sale = typeof sales.$inferSelect
export type NewSale = typeof sales.$inferInsert
export type SaleItem = typeof saleItems.$inferSelect
export type NewSaleItem = typeof saleItems.$inferInsert
