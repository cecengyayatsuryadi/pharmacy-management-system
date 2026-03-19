import { auth } from "@/auth"
import { getCategories } from "@/lib/actions/category"
import { getMedicineGroups } from "@/lib/actions/medicine-group"
import { CategoriesClient } from "./categories-client"
import { redirect } from "next/navigation"

export default async function CategoriesPage(props: {
  searchParams: Promise<{ 
    tab?: string;
    catPage?: string; 
    catSearch?: string;
    groupPage?: string;
    groupSearch?: string;
  }>
}) {
  const searchParams = await props.searchParams
  const activeTab = searchParams.tab || "categories"
  
  const catPage = Number(searchParams.catPage) || 1
  const catSearch = searchParams.catSearch || ""
  
  const groupPage = Number(searchParams.groupPage) || 1
  const groupSearch = searchParams.groupSearch || ""
  
  const session = await auth()
  if (!session?.user?.organizationId) {
    redirect("/login")
  }

  // Fetch Kategori with Metadata
  const categoriesResult = await getCategories(catPage, 10, catSearch)
  
  // Fetch Golongan with Metadata
  const groupsResult = await getMedicineGroups(groupPage, 10, groupSearch)

  return (
    <CategoriesClient 
      initialCategories={categoriesResult}
      initialGroups={groupsResult}
      activeTab={activeTab}
    />
  )
}
