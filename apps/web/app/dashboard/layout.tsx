import { auth } from "@/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { ApotekSwitcher } from "@/components/apotek-switcher"
import { CommandMenu } from "@/components/command-menu"
import { NavUser } from "@/components/nav-user"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { redirect } from "next/navigation"
import { BellIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Persiapan data organisasi untuk switcher
  const orgName = session?.user?.organizationName
    ? session.user.organizationName
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Apotek Saya"

  const organization = {
    name: orgName,
    plan: session?.user?.organizationPlan ?? "Gratis",
  }

  const user = {
    id: session?.user?.id ?? "",
    name: session?.user?.name ?? "User",
    email: session?.user?.email ?? "",
    phone: session?.user?.phone ?? "",
    avatar: session?.user?.image ?? "",
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col h-svh w-full overflow-hidden">
        {/* TopNav */}
        <header className="h-14 w-full border-b bg-background shrink-0 z-40 flex items-center justify-between px-0">
          <div className="flex items-center h-full shrink-0">
            <div className="w-[var(--sidebar-width-icon)] flex items-center justify-center shrink-0 text-primary">
              <img src="/logos/logo.svg" alt="Logo" className="size-7 object-contain" />
            </div>
            <div className="w-[var(--sidebar-width)] shrink-0 flex items-center">
              <ApotekSwitcher organization={organization} />
            </div>
          </div>

          <div className="flex-1 flex justify-center px-4 max-w-2xl mx-auto">
            <CommandMenu />
          </div>

          <div className="flex items-center gap-3 shrink-0 min-w-[200px] justify-end px-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-muted-foreground relative rounded-full hover:bg-muted/80"
            >
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-background" />
              <span className="sr-only">Notifikasi</span>
            </Button>
            <div className="h-5 w-px bg-border/60 mx-1" />
            <NavUser user={user} />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <AppSidebar session={session} />
          <SidebarInset className="flex flex-col overflow-hidden border-none shadow-none">
            <DashboardHeader />
            {/* Menggunakan pt-4 sebagai kompensasi jika breadcrumb null di dashboard */}
            <main className="flex-1 overflow-auto px-6 pb-6 pt-2">
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}
