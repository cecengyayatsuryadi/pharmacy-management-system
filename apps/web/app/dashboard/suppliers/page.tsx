import { getSuppliers } from "@/lib/actions/supplier"
import { SupplierClient } from "./supplier-client"

export default async function SuppliersPage(props: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  const { data: suppliers, metadata } = await getSuppliers(page, 10, search)

  return (
    <SupplierClient initialData={suppliers} metadata={metadata} />
  )
}
