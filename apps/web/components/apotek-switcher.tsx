"use client"

import * as React from "react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { ChevronsUpDownIcon, PlusIcon, SettingsIcon, StoreIcon } from "lucide-react"

export function ApotekSwitcher({
  organization,
}: {
  organization: {
    name: string
    plan: string
  }
}) {
  const { isMobile } = useSidebar()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <SidebarMenu className="w-full">
        <SidebarMenuItem className="w-full">
          <SidebarMenuButton size="lg" className="w-full justify-start items-center">
            <div className="flex flex-col gap-0.5 text-left text-sm leading-tight flex-1">
              <span className="truncate font-semibold text-foreground">
                {organization.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Paket {organization.plan}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu className="w-full">
      <SidebarMenuItem className="w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground justify-start items-center"
            >
              <div className="flex flex-col gap-0.5 text-left text-sm leading-tight flex-1">
                <span className="truncate font-semibold text-foreground">
                  {organization.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Paket {organization.plan}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Apotek
            </DropdownMenuLabel>
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border">
                <StoreIcon className="size-4" />
              </div>
              <div className="font-medium text-foreground">{organization.name}</div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2 cursor-pointer">
              <Link href="/dashboard/settings/organization" className="flex items-center w-full">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent mr-2">
                  <SettingsIcon className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">Pengaturan Apotek</div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 p-2 cursor-pointer text-primary">
              <div className="flex size-6 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
                <PlusIcon className="size-4" />
              </div>
              <div className="flex items-center gap-2 font-medium">
                Tambahkan Apotek
                {organization.plan === "Gratis" && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground uppercase tracking-wider">
                    Pro
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
