import { auth } from "@/auth"
import { getUnitsAction } from "@/lib/actions/unit"
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

  const { data, metadata } = await getUnitsAction(page, 10, search)

  return (
    <UnitClient 
      initialData={data} 
      metadata={metadata} 
    />
  )
}
