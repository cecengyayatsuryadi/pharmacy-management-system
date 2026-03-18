import { auth } from "@/auth"
import { db, medicines } from "@workspace/database"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { InventoryClient } from "../../inventory-client"
import { getStockMovementsAction } from "@/lib/actions/inventory"
import { getWarehousesAction } from "@/lib/actions/warehouse"

export default async function InventoryAdjustmentPage(props: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    redirect("/login")
  }

  const [allMedicines, { data, metadata }, warehouses] = await Promise.all([
    db.query.medicines.findMany({
      where: eq(medicines.organizationId, organizationId),
      orderBy: (medicines, { asc }) => [asc(medicines.name)],
    }),
    getStockMovementsAction(page, 10, search, "adjustment"),
    getWarehousesAction()
  ])

  return (
    <InventoryClient 
      medicines={allMedicines} 
      warehouses={warehouses}
      initialMovements={data as any} 
      metadata={metadata}
      defaultType="adjustment"
      title="Stok Opname"
    />
  )
}
