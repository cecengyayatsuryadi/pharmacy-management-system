import { getCategories } from "@/lib/actions/category"
import { CategoryClient } from "./category-client"

export default async function CategoriesPage(props: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  const { data: categories, metadata } = await getCategories(page, 10, search)

  return (
    <CategoryClient initialData={categories} metadata={metadata} />
  )
}
