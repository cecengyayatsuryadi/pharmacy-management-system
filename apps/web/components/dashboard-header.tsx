"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"

const labelOverrides: Record<string, string> = {
  dashboard: "Dashboard",
  pos: "Kasir (POS)",
  medicines: "Data Obat",
  categories: "Kategori Obat",
  inventory: "Inventori",
  stock: "Stok",
  warehouse: "Gudang",
  transfer: "Transfer Stok",
  in: "Stok Masuk",
  out: "Stok Keluar",
  adjustment: "Stok Opname",
  procurement: "Pengadaan",
  purchases: "Riwayat Pembelian",
  mappings: "Mapping Supplier",
  suppliers: "Data Supplier",
  reports: "Laporan",
  settings: "Pengaturan",
  help: "Bantuan",
}

export function DashboardHeader() {
  const pathname = usePathname()
  
  // Jika di dashboard utama, jangan tampilkan breadcrumb (biar bersih)
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return null
  }

  const segments = pathname.split("/").filter(Boolean)

  return (
    <header className="flex h-10 shrink-0 items-center gap-2 px-4">
      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1
            const url = `/${segments.slice(0, index + 1).join("/")}`
            const label = labelOverrides[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

            if (segment === "dashboard" && index === 0) {
              return (
                <React.Fragment key={url}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="text-xs">{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={url} className="text-xs">{label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            }

            return (
              <React.Fragment key={url}>
                <BreadcrumbSeparator className="[&>svg]:size-3" />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="text-xs">{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={url} className="text-xs">{label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
