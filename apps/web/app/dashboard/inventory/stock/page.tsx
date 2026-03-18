import { auth } from "@/auth"
import { getStockItemsAction } from "@/lib/actions/stock"
import { getWarehousesAction } from "@/lib/actions/warehouse"
import { StockClient } from "./stock-client"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Stok Real-time | Apotek",
  description: "Pantau saldo stok obat per gudang dan batch secara real-time.",
}

export default async function StockPage(props: {
  searchParams: Promise<{ page?: string; search?: string; warehouseId?: string }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  const warehouseId = searchParams.warehouseId || ""

  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    redirect("/login")
  }

  const [stockData, warehouses] = await Promise.all([
    getStockItemsAction(page, 10, search, warehouseId),
    getWarehousesAction()
  ])

  return (
    <StockClient 
      initialData={stockData.data} 
      warehouses={warehouses}
      metadata={stockData.metadata} 
    />
  )
}
