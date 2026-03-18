import { auth } from "@/auth"
import { getCategories } from "@/lib/actions/category"
import { getMedicineGroups } from "@/lib/actions/medicine-group"
import { CategoriesClient } from "./categories-client"
import { redirect } from "next/navigation"

export default async function CategoriesPage(props: {
  searchParams: Promise<{ page?: string; search?: string; tab?: string }>
}) {
  const searchParams = await props.searchParams
  const session = await auth()
  if (!session?.user?.organizationId) {
    redirect("/login")
  }

  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  const activeTab = searchParams.tab || "categories"

  // Fetch both but we might only show one based on tab (for simplicity we fetch both for now or conditionally)
  // To follow the "Tampilkan jumlah produk", we already have it in the actions
  const categoriesData = await getCategories(page, 10, search)
  const groupsData = await getMedicineGroups(page, 10, search)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Kategori & Golongan</h2>
      </div>
      <CategoriesClient 
        initialCategories={categoriesData}
        initialGroups={groupsData}
        activeTab={activeTab}
      />
    </div>
  )
}
