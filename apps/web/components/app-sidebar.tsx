"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarRail,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import {
  LayoutDashboardIcon,
  ShoppingCartIcon,
  ClipboardListIcon,
  Settings2Icon,
  CircleHelpIcon,
  HandCoinsIcon,
  BoxesIcon,
  PackageIcon,
} from "lucide-react"
import { AppSettingsDialog } from "@/components/app-settings-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

const featureModules = [
  { 
    id: "dashboard", 
    title: "Dashboard", 
    icon: <LayoutDashboardIcon className="size-5" />, 
    url: "/dashboard",
    matcher: (path: string) => path === "/dashboard" || path === "/dashboard/"
  },
  { 
    id: "inventory", 
    title: "Inventory", 
    icon: <BoxesIcon className="size-5" />, 
    url: "/dashboard/inventory",
    matcher: (path: string) => path.startsWith("/dashboard/inventory") || path.startsWith("/dashboard/medicines") || path.startsWith("/dashboard/categories") || path.startsWith("/dashboard/suppliers")
  },
  { 
    id: "procurement", 
    title: "Procurement", 
    icon: <HandCoinsIcon className="size-5" />, 
    url: "/dashboard/procurement",
    matcher: (path: string) => path.startsWith("/dashboard/procurement")
  },
  { 
    id: "pos", 
    title: "Kasir (POS)", 
    icon: <ShoppingCartIcon className="size-5" />, 
    url: "/dashboard/pos",
    matcher: (path: string) => path.startsWith("/dashboard/pos")
  },
  { 
    id: "reports", 
    title: "Laporan", 
    icon: <ClipboardListIcon className="size-5" />, 
    url: "/dashboard/reports",
    matcher: (path: string) => path.startsWith("/dashboard/reports")
  },
]

const systemModules = [
  { 
    id: "settings", 
    title: "Pengaturan", 
    icon: <Settings2Icon className="size-5" />, 
    url: "#", 
    matcher: (path: string) => path.startsWith("/dashboard/settings")
  },
  { 
    id: "help", 
    title: "Bantuan", 
    icon: <CircleHelpIcon className="size-5" />, 
    url: "/dashboard/help",
    matcher: (path: string) => path.startsWith("/dashboard/help")
  },
]

const moduleData: Record<string, any> = {
  inventory: {
    navMain: [
      {
        title: "Master Produk",
        url: "#",
        items: [
          { title: "Data Obat", url: "/dashboard/medicines" },
          { title: "Kategori & Golongan", url: "/dashboard/categories" },
          { title: "Satuan & Konversi", url: "/dashboard/inventory/master/units" },
          { title: "Barcode Manager", url: "/dashboard/inventory/master/barcodes" },
        ],
      },
      {
        title: "Stok",
        url: "#",
        items: [
          { title: "Stok Real-time", url: "/dashboard/inventory/stock" },
          { title: "Stok Masuk", url: "/dashboard/inventory/stock/in" },
          { title: "Stok Keluar", url: "/dashboard/inventory/stock/out" },
          { title: "Stok Opname", url: "/dashboard/inventory/stock/adjustment" },
          { title: "Transfer Stok", url: "/dashboard/inventory/transfer" },
        ],
      },
      {
        title: "Batch & Kadaluarsa",
        url: "#",
        items: [
          { title: "Tracking Batch", url: "/dashboard/inventory/batch" },
          { title: "Alert Expired", url: "/dashboard/inventory/batch/expired-alerts" },
          { title: "Pemusnahan Obat", url: "/dashboard/inventory/batch/disposal" },
        ],
      },
      {
        title: "Gudang",
        url: "#",
        items: [
          { title: "Master Gudang", url: "/dashboard/inventory/warehouse" },
          { title: "Lokasi Rak", url: "/dashboard/inventory/warehouse/racks" },
        ],
      },
      { title: "Supplier", url: "/dashboard/suppliers" },
    ],
  },
  procurement: {
    navMain: [
      { title: "Pembelian", url: "/dashboard/procurement/purchases" },
      { title: "Retur Supplier", url: "/dashboard/procurement/returns" },
      { title: "Mapping Supplier Obat", url: "/dashboard/procurement/mappings" },
    ],
  },
  pos: {
    navMain: [
      { title: "Transaksi Kasir", url: "/dashboard/pos" },
      { title: "Riwayat Penjualan", url: "/dashboard/reports/sales" },
    ],
  },
  reports: {
    navMain: [
      { title: "Laporan Stok", url: "/dashboard/reports/inventory" },
      { title: "Laporan Penjualan", url: "/dashboard/reports/sales" },
      { title: "Laporan Keuangan", url: "/dashboard/reports/finance" },
    ],
  },
  help: {
    navMain: [
      { title: "Panduan Pengguna", url: "/dashboard/help/guide" },
      { title: "FAQ", url: "/dashboard/help/faq" },
      { title: "Kontak Support", url: "/dashboard/help/support" },
    ],
  },
}

export function AppSidebar({
  session,
  ...props
}: { session: any } & React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { setOpen, open } = useSidebar()
  const [appSettingsOpen, setAppSettingsOpen] = React.useState(false)
  
  const allModules = [...featureModules, ...systemModules]
  const activeModule = allModules.find(m => m.matcher(pathname)) || allModules[0]
  
  const hasSubMenu = activeModule ? !!moduleData[activeModule.id] : false
  const currentModuleData = activeModule ? moduleData[activeModule.id] : null

  const handleModuleClick = (moduleId: string, e: React.MouseEvent) => {
    if (moduleId === "settings") {
      e.preventDefault()
      setAppSettingsOpen(true)
      return
    }

    const targetHasSubMenu = !!moduleData[moduleId]

    if (activeModule?.id === moduleId) {
      if (targetHasSubMenu) {
        e.preventDefault()
        setOpen(!open)
      }
    } else {
      if (!targetHasSubMenu) {
        setOpen(false)
      } else {
        setOpen(true)
      }
    }
  }

  return (
    <>
      <TooltipProvider delayDuration={0}>
        {/* Primary Sidebar - RAIL */}
        <aside className="z-30 flex h-full w-[var(--sidebar-width-icon)] flex-col border-r bg-sidebar shrink-0 sticky top-0">
          <div 
            className="flex h-16 items-center justify-center border-b shrink-0 cursor-pointer hover:bg-sidebar-accent transition-colors"
            onClick={() => hasSubMenu && setOpen(!open)}
            title={hasSubMenu ? "Toggle Sidebar" : "Logo"}
          >
             <img src="/logos/logo.svg" alt="Logo" className="size-8 object-contain" />
          </div>
          
          {/* Fitur Operasional */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-2">
            <nav className="flex flex-col items-center gap-1 px-2">
              {featureModules.map((m) => {
                const isActive = activeModule?.id === m.id
                return (
                  <Tooltip key={m.id}>
                    <TooltipTrigger asChild>
                      <a
                        href={m.url}
                        onClick={(e) => handleModuleClick(m.id, e)}
                        className={`flex size-10 items-center justify-center rounded-md transition-all duration-200 shrink-0 ${
                          isActive ? "text-primary bg-sidebar-accent" : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                        }`}
                      >
                        {m.icon}
                        <span className="sr-only">{m.title}</span>
                      </a>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10}>
                      {m.title}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </nav>
          </div>

          {/* Sistem & Dukungan (Bawah) */}
          <div className="py-4 flex flex-col items-center gap-1 border-t shrink-0">
            {systemModules.map((m) => {
              const isActive = activeModule?.id === m.id
              return (
                <Tooltip key={m.id}>
                  <TooltipTrigger asChild>
                    <a
                      href={m.url}
                      onClick={(e) => handleModuleClick(m.id, e)}
                      className={`flex size-10 items-center justify-center rounded-lg transition-all duration-200 shrink-0 ${
                        isActive ? "text-primary bg-sidebar-accent" : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }`}
                    >
                      {m.icon}
                      <span className="sr-only">{m.title}</span>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    {m.title}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </aside>
      </TooltipProvider>

      {/* Secondary Sidebar - PANEL */}
      {hasSubMenu && currentModuleData && (
        <Sidebar collapsible="offcanvas" className="hidden border-l-0 md:flex h-full" {...props}>
          <style dangerouslySetInnerHTML={{ __html: `
            [data-slot="sidebar"][data-state="expanded"] [data-slot="sidebar-container"] {
              left: var(--sidebar-width-icon) !important;
              height: calc(100vh - 3.5rem) !important;
              top: 3.5rem !important;
            }
          `}} />
          <SidebarContent>
            <NavMain items={currentModuleData.navMain} label={activeModule?.title || ""} />
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
      )}

      {/* Gunakan AppSettingsDialog khusus untuk pengaturan sistem */}
      <AppSettingsDialog 
        open={appSettingsOpen} 
        onOpenChange={setAppSettingsOpen}
      />
    </>
  )
}
