import { getMedicines } from "@/lib/actions/medicine"
import { BarcodeClient } from "./barcode-client"
import { format } from "date-fns"

export default async function BarcodeManagerPage(props: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const searchParams = await props.searchParams
  const search = searchParams.search || ""
  const page = Number(searchParams.page) || 1
  const limit = 10 // Standard limit

  const { data, metadata } = await getMedicines(page, limit, search)

  const initialRows = data.map((m) => ({
    id: m.id,
    barcode: m.sku || "-",
    medicine: m.name,
    format: m.sku?.startsWith("899") ? "EAN-13" : "Custom", // Simple heuristic
    status: m.isActive ? "Aktif" : "Non-Aktif",
    updatedAt: m.createdAt ? format(new Date(m.createdAt), "yyyy-MM-dd") : "-",
  }))

  return (
    <BarcodeClient 
      initialRows={initialRows} 
      metadata={metadata}
    />
  )
}
