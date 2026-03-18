import { auth } from "@/auth"
import { getWarehousesAction } from "@/lib/actions/warehouse"
import { WarehouseClient } from "./warehouse-client"
import { redirect } from "next/navigation"

export default async function WarehousePage() {
  const session = await auth()
  if (!session?.user?.organizationId) {
    redirect("/login")
  }

  const warehouses = await getWarehousesAction()

  return (
    <WarehouseClient initialWarehouses={warehouses} />
  )
}
