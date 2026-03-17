"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import { AppSettingsDialog } from "@/components/app-settings-dialog"

export interface NavItem {
  name: string
  url: string
  icon: React.ReactNode
}

export function NavLinks({
  items,
  label,
}: {
  items: NavItem[]
  label?: string
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          if (item.url === "/dashboard/settings") {
            return (
              <SidebarMenuItem key={item.name}>
                <AppSettingsDialog
                  trigger={
                    <SidebarMenuButton tooltip={item.name}>
                      {item.icon}
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  }
                />
              </SidebarMenuItem>
            )
          }

          const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild tooltip={item.name}>
                <a
                  href={item.url}
                  aria-current={isActive ? "page" : undefined}
                  className={isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : undefined}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
