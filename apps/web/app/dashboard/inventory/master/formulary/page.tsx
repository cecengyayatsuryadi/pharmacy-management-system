import { auth } from "@/auth"
import { getFormulariesAction, getSubstitutionsAction } from "@/lib/actions/formulary"
import { getMedicines } from "@/lib/actions/medicine"
import { FormularyClient } from "./formulary-client"
import { redirect } from "next/navigation"

export default async function FormularyPage(props: {
  searchParams: Promise<{ page?: string; search?: string; type?: string; medicineId?: string }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  const type = searchParams.type || ""
  const medicineId = searchParams.medicineId || ""
  
  const session = await auth()
  if (!session?.user?.organizationId) {
    redirect("/login")
  }

  // Ambil data untuk kedua tab
  const [formularyData, substitutionData, medicineData] = await Promise.all([
    getFormulariesAction(page, 10, search, type),
    getSubstitutionsAction(page, 10, search, medicineId),
    getMedicines(1, 100) // Untuk dropdown pilih obat
  ])

  return (
    <FormularyClient 
      initialFormularies={formularyData.data}
      initialSubstitutions={substitutionData.data}
      medicines={medicineData.data}
      formularyMetadata={formularyData.metadata}
      substitutionMetadata={substitutionData.metadata}
    />
  )
}
