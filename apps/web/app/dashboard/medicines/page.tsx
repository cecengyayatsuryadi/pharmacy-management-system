import { getMedicines } from "@/lib/actions/medicine"
import { getCategories } from "@/lib/actions/category"
import { MedicineClient } from "./medicine-client"

export default async function MedicinesPage(props: {
  searchParams: Promise<{ page?: string; search?: string; categoryId?: string }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  const categoryId = searchParams.categoryId || ""

  // Fetch medicines and categories in parallel
  const [{ data: medicinesData, metadata }, categories] = await Promise.all([
    getMedicines(page, 10, search, categoryId),
    getCategories(1, 100) // Ambil kategori agak banyak buat dropdown
  ])

  return (
    <MedicineClient 
      initialData={medicinesData as any} 
      categories={categories.data} 
      metadata={metadata}
    />
  )
}
