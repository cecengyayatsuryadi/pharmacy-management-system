import { auth } from "@/auth"
import { getMedicines } from "@/lib/actions/medicine"
import { getCategories } from "@/lib/actions/category"
import { getUnitsAction } from "@/lib/actions/unit"
import { MedicineClient } from "./medicine-client"
import { redirect } from "next/navigation"

export default async function MedicinesPage(props: {
  searchParams: Promise<{ page?: string; search?: string; categoryId?: string; status?: string }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  const categoryId = searchParams.categoryId
  const status = searchParams.status || ""
  
  const session = await auth()
  if (!session?.user?.organizationId) {
    redirect("/login")
  }

  const [medicineData, categoryData, unitData] = await Promise.all([
    getMedicines(page, 10, search, categoryId, status),
    getCategories(),
    getUnitsAction(1, 100) // Ambil banyak untuk dropdown
  ])

  return (
    <MedicineClient 
      initialData={medicineData.data} 
      categories={categoryData.data} 
      units={unitData.data} 
      metadata={medicineData.metadata} 
    />
  )
}
