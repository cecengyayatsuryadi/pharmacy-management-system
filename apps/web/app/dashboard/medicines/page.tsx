import { getMedicines } from "@/lib/actions/medicine"
import { getCategories } from "@/lib/actions/category"
import { getUnitsAction } from "@/lib/actions/unit"
import { MedicineClient } from "./medicine-client"

export default async function MedicinesPage(props: {
  searchParams: Promise<{ page?: string; search?: string; categoryId?: string }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  const categoryId = searchParams.categoryId || ""

  // Fetch medicines, categories and units in parallel
  const [{ data: medicinesData, metadata }, categories, units] = await Promise.all([
    getMedicines(page, 10, search, categoryId),
    getCategories(1, 100), // Ambil kategori agak banyak buat dropdown
    getUnitsAction()
  ])

  return (
    <MedicineClient 
      initialData={medicinesData as any} 
      categories={categories.data} 
      units={units}
      metadata={metadata}
    />
  )
}
