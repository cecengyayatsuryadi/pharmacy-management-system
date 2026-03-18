import * as React from "react"
import { auth } from "@/auth"
import { getFormattedOrganizationPlan } from "@/lib/organization-plan"
import { NavMain } from "@/components/nav-main"
import { NavLinks } from "@/components/nav-links"
import { NavUser } from "@/components/nav-user"
import { ApotekSwitcher } from "@/components/apotek-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar"
import {
  LayoutDashboardIcon,
  PackageIcon,
  ShoppingCartIcon,
  ClipboardListIcon,
  Settings2Icon,
  CircleHelpIcon,
  HandCoinsIcon,
  LibraryIcon,
  DatabaseIcon,
  WarehouseIcon,
  ClockIcon,
  ActivityIcon,
  BoxesIcon,
  BarcodeIcon,
} from "lucide-react"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
      isActive: true,
    },
    {
      title: "Inventory",
      url: "#",
      icon: <BoxesIcon />,
      items: [
        {
          title: "Master Produk",
          url: "#",
          items: [
            {
              title: "Data Obat",
              url: "/dashboard/medicines",
            },
            {
              title: "Kategori & Golongan",
              url: "/dashboard/categories",
            },
            {
              title: "Satuan & Konversi",
              url: "/dashboard/inventory/master/units",
            },
            {
              title: "Barcode Manager",
              url: "/dashboard/inventory/master/barcodes",
            },
          ],
        },
        {
          title: "Stok",
          url: "#",
          items: [
            {
              title: "Stok Real-time",
              url: "/dashboard/inventory/stock",
            },
            {
              title: "Stok Masuk",
              url: "/dashboard/inventory/stock/in",
            },
            {
              title: "Stok Keluar",
              url: "/dashboard/inventory/stock/out",
            },
            {
              title: "Stok Opname",
              url: "/dashboard/inventory/stock/adjustment",
            },
            {
              title: "Transfer Stok",
              url: "/dashboard/inventory/transfer",
            },
          ],
        },
        {
          title: "Batch & Kadaluarsa",
          url: "#",
          items: [
            {
              title: "Tracking Batch",
              url: "/dashboard/inventory/batch",
            },
            {
              title: "Alert Expired",
              url: "/dashboard/inventory/batch/expired-alerts",
            },
            {
              title: "Pemusnahan Obat",
              url: "/dashboard/inventory/batch/disposal",
            },
          ],
        },
        {
          title: "Gudang",
          url: "#",
          items: [
            {
              title: "Master Gudang",
              url: "/dashboard/inventory/warehouse",
            },
            {
              title: "Lokasi Rak",
              url: "/dashboard/inventory/warehouse/racks",
            },
          ],
        },
        {
          title: "Supplier",
          url: "/dashboard/suppliers",
        },
      ],
    },
    {
      title: "Procurement",
      url: "#",
      icon: <HandCoinsIcon />,
      items: [
        {
          title: "Pembelian",
          url: "/dashboard/procurement/purchases",
        },
        {
          title: "Retur Supplier",
          url: "/dashboard/procurement/returns",
        },
        {
          title: "Mapping Supplier Obat",
          url: "/dashboard/procurement/mappings",
        },
      ],
    },
  ],
  operational: [
    {
      name: "Kasir (POS)",
      url: "/dashboard/pos",
      icon: <ShoppingCartIcon />,
    },
    {
      name: "Laporan",
      url: "/dashboard/reports",
      icon: <ClipboardListIcon />,
    },
  ],
  secondary: [
    {
      name: "Pengaturan",
      url: "/dashboard/settings",
      icon: <Settings2Icon />,
    },
    {
      name: "Bantuan",
      url: "/dashboard/help",
      icon: <CircleHelpIcon />,
    },
  ],
}

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  const user = {
    id: session?.user?.id ?? "",
    name: session?.user?.name ?? "User",
    email: session?.user?.email ?? "",
    phone: session?.user?.phone ?? "",
    avatar: session?.user?.image ?? "",
  }

  const role = session?.user?.role

  // Filter main items and their children based on role
  const filteredNavMain = data.navMain.map(item => ({
    ...item,
    items: item.items?.filter(subItem => {
      if ((subItem as any).adminOnly && role !== "admin") return false
      return true
    })
  }))

  // Filter operational items based on role
  const filteredOperational = data.operational.filter(p => {
    if (p.name === "Laporan" && role !== "admin") return false
    return true
  })

  // Real data from session with capitalization normalization
  const orgName = session?.user?.organizationName
    ? session.user.organizationName
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Apotek Saya"

  const organizationPlan = organizationId
    ? await getFormattedOrganizationPlan(organizationId)
    : "Gratis"

  const organization = {
    name: orgName,
    logo: (
      <img src="/logos/logo.svg" alt="Logo" className="size-8 object-contain" />
    ),
    plan: organizationPlan,
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ApotekSwitcher organization={organization} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} label="Menu Utama" />
        <NavLinks items={filteredOperational} label="Operasional" />
      </SidebarContent>
      <SidebarFooter>
        <NavLinks items={data.secondary} label="Dukungan" />
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
