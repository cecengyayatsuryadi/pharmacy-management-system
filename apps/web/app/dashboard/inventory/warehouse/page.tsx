import { auth } from "@/auth"
import { getWarehousesAction } from "@/lib/actions/warehouse"
import { WarehouseClient } from "./warehouse-client"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Manajemen Gudang | Apotek",
  description: "Kelola lokasi penyimpanan dan gudang apotek Anda.",
}

export default async function WarehousePage() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    redirect("/login")
  }

  const warehouses = await getWarehousesAction()

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <WarehouseClient initialWarehouses={warehouses} />
    </div>
  )
}
