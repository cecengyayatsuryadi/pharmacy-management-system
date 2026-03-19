"use client"

import * as React from "react"
import {
  Settings,
  User,
  SearchIcon,
  PackageIcon,
  ShoppingCartIcon,
  TruckIcon,
  BarChart3Icon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@workspace/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <div className="relative w-full max-w-md">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-md border px-3 text-sm transition-all duration-200 ring-offset-background focus-visible:outline-none",
              open 
                ? "border-primary bg-background shadow-[0_0_0_2px_rgba(var(--primary),0.1)] ring-1 ring-primary" 
                : "border-input bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-2">
              <SearchIcon className={cn("h-4 w-4 shrink-0 transition-colors", open ? "text-primary" : "opacity-50")} />
              <span className={cn(open ? "text-foreground font-medium" : "text-muted-foreground")}>
                {open ? "Ketik untuk mencari..." : "Cari obat, transaksi..."}
              </span>
            </div>
            <kbd className={cn(
              "pointer-events-none hidden h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex transition-colors",
              open ? "bg-primary text-primary-foreground border-primary" : "bg-background"
            )}>
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0 border-none shadow-none" 
          align="start"
          sideOffset={4}
        >
          <Command className="w-full rounded-lg border shadow-md">
            <CommandInput placeholder="Ketik perintah atau cari..." autoFocus />
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>Hasil tidak ditemukan.</CommandEmpty>
              <CommandGroup heading="Navigasi Cepat">
                <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/pos"))}>
                  <ShoppingCartIcon className="mr-2 h-4 w-4" />
                  <span>Kasir (POS)</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/inventory/master/medicines"))}>
                  <PackageIcon className="mr-2 h-4 w-4" />
                  <span>Data Obat</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/inventory/stock"))}>
                  <BarChart3Icon className="mr-2 h-4 w-4" />
                  <span>Cek Stok Real-time</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/procurement/purchases"))}>
                  <TruckIcon className="mr-2 h-4 w-4" />
                  <span>Pengadaan / Pembelian</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Pengaturan">
                <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings"))}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil Apotek</span>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings/users"))}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Manajemen User</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </CommandList>
            <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border bg-background px-1">↵</kbd> Pilih
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border bg-background px-1">↑↓</kbd> Navigasi
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-background px-1">Esc</kbd> Tutup
              </span>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
