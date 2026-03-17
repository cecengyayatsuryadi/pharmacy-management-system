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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
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
import { BellIcon, PaintbrushIcon, SlidersHorizontalIcon } from "lucide-react"

export function AppSettingsDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [tab, setTab] = React.useState<"umum" | "tampilan" | "notifikasi">("umum")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="overflow-hidden p-0 md:max-h-[90dvh] md:max-w-[980px]">
        <DialogTitle className="sr-only">Pengaturan</DialogTitle>
        <DialogDescription className="sr-only">
          Atur preferensi aplikasi.
        </DialogDescription>
        <SidebarProvider className="h-[78dvh] min-h-[36rem] items-stretch">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <div className="space-y-1 px-3 py-3">
                <p className="text-sm font-medium">Pengaturan</p>
                <p className="text-xs text-muted-foreground">Atur preferensi aplikasi.</p>
              </div>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={tab === "umum"} onClick={() => setTab("umum")}>
                        <SlidersHorizontalIcon />
                        <span>Umum</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={tab === "tampilan"} onClick={() => setTab("tampilan")}>
                        <PaintbrushIcon />
                        <span>Tampilan</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={tab === "notifikasi"} onClick={() => setTab("notifikasi")}>
                        <BellIcon />
                        <span>Notifikasi</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <Separator orientation="vertical" className="hidden self-stretch md:block" />
          <main className="flex h-full flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Pengaturan</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {tab === "umum" ? "Umum" : tab === "tampilan" ? "Tampilan" : "Notifikasi"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 pt-0">
              {tab === "umum" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-1">
                      <Label htmlFor="compact">Mode Ringkas</Label>
                      <p className="text-xs text-muted-foreground">Gunakan tampilan lebih padat di dashboard.</p>
                    </div>
                    <input id="compact" type="checkbox" className="size-4 accent-primary" />
                  </div>
                </div>
              )}

              {tab === "tampilan" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-1">
                      <Label htmlFor="dense-table">Tabel Rapat</Label>
                      <p className="text-xs text-muted-foreground">Kurangi jarak antar baris tabel.</p>
                    </div>
                    <input id="dense-table" type="checkbox" className="size-4 accent-primary" />
                  </div>
                </div>
              )}

              {tab === "notifikasi" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-1">
                      <Label htmlFor="notif">Notifikasi Transaksi</Label>
                      <p className="text-xs text-muted-foreground">Tampilkan notifikasi saat transaksi selesai.</p>
                    </div>
                    <input id="notif" type="checkbox" className="size-4 accent-primary" />
                  </div>
                </div>
              )}
            </div>

          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
