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
import { IdCardIcon, KeyRoundIcon } from "lucide-react"
import { type Session } from "next-auth"
import { PasswordForm, ProfileForm } from "@/components/settings-form"

type ProfileFormUser = Pick<Session["user"], "id" | "name" | "email" | "phone">

export function SettingsDialog({
  user,
  trigger,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: {
  user: ProfileFormUser
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
  const [tab, setTab] = React.useState<"profile" | "password">("profile")

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="overflow-hidden p-0 md:max-h-[90dvh] md:max-w-[980px]">
        <DialogTitle className="sr-only">Profil Akun</DialogTitle>
        <DialogDescription className="sr-only">
          Kelola data diri dan keamanan akun Anda.
        </DialogDescription>
        <SidebarProvider className="h-[78dvh] min-h-[36rem] items-stretch">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <div className="space-y-1 px-3 py-3">
                <p className="text-sm font-medium">Profil Akun</p>
                <p className="text-xs text-muted-foreground">Kelola data diri dan keamanan akun Anda.</p>
              </div>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={tab === "profile"} onClick={() => setTab("profile")}>
                        <IdCardIcon />
                        <span>Profil Saya</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={tab === "password"} onClick={() => setTab("password")}>
                        <KeyRoundIcon />
                        <span>Ganti Password</span>
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
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Profil Akun</BreadcrumbPage>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{tab === "profile" ? "Profil Saya" : "Ganti Password"}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex gap-2 px-4 pb-2 md:hidden">
              <Button variant={tab === "profile" ? "default" : "outline"} size="sm" onClick={() => setTab("profile")}>
                Profil
              </Button>
              <Button variant={tab === "password" ? "default" : "outline"} size="sm" onClick={() => setTab("password")}>
                Password
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pt-0">
              {tab === "profile" ? <ProfileForm user={user} withCard={false} /> : <PasswordForm withCard={false} />}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
