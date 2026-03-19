import { auth } from "@/auth"
import { getUnitsAction } from "@/lib/actions/unit"
import { getMedicines } from "@/lib/actions/medicine"
import { getConversionsAction } from "@/lib/actions/conversion"
import { UnitClient } from "./unit-client"
import { redirect } from "next/navigation"

export default async function UnitsPage(props: {
  searchParams: Promise<{ 
    unitPage?: string; 
    unitSearch?: string;
    convPage?: string;
    convSearch?: string;
  }>
}) {
  const searchParams = await props.searchParams
  const unitPage = Number(searchParams.unitPage) || 1
  const unitSearch = searchParams.unitSearch || ""
  const convPage = Number(searchParams.convPage) || 1
  const convSearch = searchParams.convSearch || ""
  
  const session = await auth()
  if (!session?.user?.organizationId) {
    redirect("/login")
  }

  // Fetch Units with Metadata
  const unitsResult = await getUnitsAction(unitPage, 10, unitSearch)
  
  // Fetch Conversions with Metadata
  const conversionsResult = await getConversionsAction(convPage, 10, convSearch)
  
  // Medicines (still used for combobox in form, maybe just get a few or searchable)
  const { data: medicines } = await getMedicines(1, 15, "")

  return (
    <UnitClient 
      initialUnits={unitsResult.data}
      unitMetadata={unitsResult.metadata}
      medicines={medicines}
      initialConversions={conversionsResult.data}
      convMetadata={conversionsResult.metadata}
    />
  )
}
