import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { LayoutDashboardIcon, LogInIcon, PlusCircleIcon, PillIcon } from "lucide-react"

export default async function Page() {
  const session = await auth()
  
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2 font-bold text-xl">
            <PillIcon className="size-6 text-primary" />
            <span>Apotek System</span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Mulai Sekarang</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Kelola Apotek Anda dengan <span className="text-primary">Cerdas</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Sistem manajemen stok, penjualan, dan inventaris obat yang modern, cepat, dan mudah digunakan. Cocok untuk apotek mandiri maupun berjaringan.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="px-8">
                  <Link href="/signup">
                    <PlusCircleIcon className="mr-2 size-5" />
                    Daftar Apotek Baru
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="px-8">
                  <Link href="/login">
                    <LogInIcon className="mr-2 size-5" />
                    Masuk ke Sistem
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Brief */}
        <section className="w-full py-12 bg-muted/50">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <LayoutDashboardIcon className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Dashboard Real-time</h3>
                <p className="text-sm text-muted-foreground">Pantau performa apotek Anda secara langsung dari satu layar.</p>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <PillIcon className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Manajemen Stok</h3>
                <p className="text-sm text-muted-foreground">Kelola ribuan obat dengan peringatan otomatis untuk stok rendah dan kadaluwarsa.</p>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <LogInIcon className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Akses Multi-Staff</h3>
                <p className="text-sm text-muted-foreground">Batasi hak akses antara Admin, Apoteker, dan Kasir dengan mudah.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-6">
          <p className="text-sm text-muted-foreground">
            © 2026 Apotek Management System. Made for better healthcare.
          </p>
          <div className="text-muted-foreground font-mono text-xs">
            v0.1.0-alpha
          </div>
        </div>
      </footer>
    </div>
  )
}
