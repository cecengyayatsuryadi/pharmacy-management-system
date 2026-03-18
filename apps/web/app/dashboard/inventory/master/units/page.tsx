import { auth } from "@/auth"
import { getUnitsAction } from "@/lib/actions/unit"
import { getMedicines } from "@/lib/actions/medicine"
import { getConversionsAction } from "@/lib/actions/conversion"
import { UnitClient } from "./unit-client"
import { redirect } from "next/navigation"

export default async function UnitsPage(props: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  
  const session = await auth()
  if (!session?.user?.organizationId) {
    redirect("/login")
  }

  // Fetch data
  const { data: units } = await getUnitsAction(page, 100, search)
  const { data: medicines } = await getMedicines(1, 100, "")
  const conversions = await getConversionsAction()

  return (
    <UnitClient 
      initialUnits={units}
      medicines={medicines}
      conversions={conversions}
    />
  )
}
