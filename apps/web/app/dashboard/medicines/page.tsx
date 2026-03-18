import { auth } from "@/auth"
import { getMedicines } from "@/lib/actions/medicine"
import { getCategories } from "@/lib/actions/category"
import { getMedicineGroups } from "@/lib/actions/medicine-group"
import { getUnitsAction } from "@/lib/actions/unit"
import { MedicineClient } from "./medicine-client"
import { redirect } from "next/navigation"

export default async function MedicinesPage(props: {
  searchParams: Promise<{ page?: string; search?: string; categoryId?: string; status?: string; groupId?: string }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  const categoryId = searchParams.categoryId
  const groupId = searchParams.groupId
  const status = searchParams.status || ""
  
  const session = await auth()
  if (!session?.user?.organizationId) {
    redirect("/login")
  }

  const [medicineData, categoryData, groupData, unitData] = await Promise.all([
    getMedicines(page, 10, search, categoryId, status, groupId),
    getCategories(),
    getMedicineGroups(),
    getUnitsAction(1, 100) // Ambil banyak untuk dropdown
  ])

  return (
    <MedicineClient 
      initialData={medicineData.data} 
      categories={categoryData.data} 
      medicineGroups={groupData.data}
      units={unitData.data} 
      metadata={medicineData.metadata} 
    />
  )
}
