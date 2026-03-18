import { auth } from "@/auth"
import { db, medicines, purchases, stockMovements, supplierMedicines, suppliers, users, warehouses, medicineBatches } from "@workspace/database"
import { and, count, desc, eq, ilike, or } from "drizzle-orm"
import { redirect } from "next/navigation"
import { InventoryClient } from "../../inventory/inventory-client"
import { createPurchaseAction } from "@/lib/actions/procurement"
import { getWarehousesAction } from "@/lib/actions/warehouse"

export default async function ProcurementPurchasesPage(props: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  const limit = 10
  const offset = (page - 1) * limit

  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    redirect("/login")
  }

  const searchCondition = search
    ? or(
        ilike(medicines.name, `%${search}%`),
        ilike(suppliers.name, `%${search}%`),
        ilike(purchases.purchaseNumber, `%${search}%`),
        ilike(purchases.invoiceNumber, `%${search}%`),
        ilike(stockMovements.note, `%${search}%`)
      )
    : undefined

  const whereClause = and(
    eq(stockMovements.organizationId, organizationId),
    eq(stockMovements.type, "in"),
    searchCondition
  )

  const [allMedicines, allSuppliers, allWarehouses, primaryMappings, movementRows, totalCount] = await Promise.all([
    db.query.medicines.findMany({
      where: eq(medicines.organizationId, organizationId),
      orderBy: (medicines, { asc }) => [asc(medicines.name)],
    }),
    db.query.suppliers.findMany({
      where: eq(suppliers.organizationId, organizationId),
      orderBy: (suppliers, { asc }) => [asc(suppliers.name)],
    }),
    getWarehousesAction(),
    db
      .select({
        medicineId: supplierMedicines.medicineId,
        supplierId: supplierMedicines.supplierId,
      })
      .from(supplierMedicines)
      .where(
        and(
          eq(supplierMedicines.organizationId, organizationId),
          eq(supplierMedicines.isPrimary, true),
          eq(supplierMedicines.isActive, true)
        )
      ),
    db
      .select({
        id: stockMovements.id,
        type: stockMovements.type,
        quantity: stockMovements.quantity,
        resultingStock: stockMovements.resultingStock,
        reference: stockMovements.reference,
        note: stockMovements.note,
        createdAt: stockMovements.createdAt,
        purchaseNumber: purchases.purchaseNumber,
        invoiceNumber: purchases.invoiceNumber,
        medicine: {
          id: medicines.id,
          name: medicines.name,
          sku: medicines.sku,
          unit: medicines.unit,
          stock: medicines.stock,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          code: suppliers.code,
        },
        warehouse: {
          id: warehouses.id,
          name: warehouses.name,
        },
        batch: {
          id: medicineBatches.id,
          batchNumber: medicineBatches.batchNumber,
          expiryDate: medicineBatches.expiryDate,
        }
      })
      .from(stockMovements)
      .innerJoin(medicines, eq(stockMovements.medicineId, medicines.id))
      .innerJoin(users, eq(stockMovements.userId, users.id))
      .leftJoin(suppliers, eq(stockMovements.supplierId, suppliers.id))
      .leftJoin(warehouses, eq(stockMovements.warehouseId, warehouses.id))
      .leftJoin(medicineBatches, eq(stockMovements.batchId, medicineBatches.id))
      .leftJoin(
        purchases,
        eq(stockMovements.purchaseId, purchases.id)
      )
      .where(whereClause)
      .orderBy(desc(stockMovements.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(stockMovements)
      .innerJoin(medicines, eq(stockMovements.medicineId, medicines.id))
      .leftJoin(suppliers, eq(stockMovements.supplierId, suppliers.id))
      .leftJoin(
        purchases,
        eq(stockMovements.purchaseId, purchases.id)
      )
      .where(whereClause),
  ])

  const total = Number(totalCount[0]?.value ?? 0)
  const primarySupplierByMedicine = Object.fromEntries(
    primaryMappings.map((row) => [row.medicineId, row.supplierId])
  ) as Record<string, string>

  return (
    <InventoryClient
      medicines={allMedicines}
      suppliers={allSuppliers}
      warehouses={allWarehouses}
      primarySupplierByMedicine={primarySupplierByMedicine}
      initialMovements={movementRows as any}
      metadata={{
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }}
      defaultType="in"
      title="Pembelian"
      submitAction={createPurchaseAction}
      showPurchaseColumns
    />
  )
}
