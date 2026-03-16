"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Ringkasan Dashboard",
  "/dashboard/medicines": "Data Obat",
  "/dashboard/categories": "Kategori Obat",
  "/dashboard/inventory/in": "Stok Masuk",
  "/dashboard/inventory/out": "Stok Keluar",
  "/dashboard/inventory/adjustment": "Stok Opname",
  "/dashboard/pos": "Kasir (POS)",
  "/dashboard/reports": "Laporan",
  "/dashboard/settings": "Pengaturan",
  "/dashboard/help": "Bantuan",
}

export function DashboardHeader() {
  const pathname = usePathname()
  const pageTitle = breadcrumbMap[pathname] || "Dashboard"

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard">
                Manajemen Apotek
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
