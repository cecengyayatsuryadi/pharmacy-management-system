"use client"

import * as React from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@workspace/ui/components/sidebar"
import { Separator } from "@workspace/ui/components/separator"
import { Building2Icon, UsersIcon, PrinterIcon, ShieldCheckIcon } from "lucide-react"

export function AppSettingsDialog({
  trigger,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = controlledOpen ?? uncontrolledOpen
  const handleOpenChange = (nextOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }
  const [tab, setTab] = React.useState<"general" | "users" | "receipt">("general")

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="overflow-hidden p-0 md:max-h-[90dvh] md:max-w-[980px]">
        <DialogTitle className="sr-only">Pengaturan Sistem</DialogTitle>
        <DialogDescription className="sr-only">
          Konfigurasi profil apotek, manajemen user, dan sistem aplikasi.
        </DialogDescription>
        <SidebarProvider className="h-[78dvh] min-h-[36rem] items-stretch">
          <Sidebar collapsible="none" className="hidden md:flex border-r-0">
            <SidebarContent>
              <div className="space-y-1 px-3 py-3">
                <p className="text-sm font-medium">Pengaturan Sistem</p>
                <p className="text-xs text-muted-foreground">Kelola konfigurasi apotek Anda.</p>
              </div>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={tab === "general"} onClick={() => setTab("general")}>
                        <Building2Icon />
                        <span>Profil Apotek</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={tab === "users"} onClick={() => setTab("users")}>
                        <UsersIcon />
                        <span>Manajemen User</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={tab === "receipt"} onClick={() => setTab("receipt")}>
                        <PrinterIcon />
                        <span>Konfigurasi Struk</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <Separator orientation="vertical" className="hidden self-stretch md:block" />
          <main className="flex h-full flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbPage>Pengaturan</BreadcrumbPage>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {tab === "general" ? "Profil Apotek" : tab === "users" ? "Manajemen User" : "Konfigurasi Struk"}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Konten akan diisi form masing-masing nanti */}
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShieldCheckIcon className="size-12 mb-4 opacity-20" />
                <p>Form {tab} sedang dalam pengembangan.</p>
              </div>
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
