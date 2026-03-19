"use client"

import * as React from "react"
import { PlusIcon, SearchIcon, MoreHorizontalIcon, PencilIcon, TrashIcon, XIcon, BarcodeIcon, Link2Icon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter,
  SheetDescription
} from "@workspace/ui/components/sheet"
import { Badge } from "@workspace/ui/components/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { useSearchParams, useRouter } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"

type BarcodeRow = {
  id: string
  barcode: string
  medicine: string
  format: string
  status: string
  updatedAt: string
}

export function BarcodeClient({ initialRows }: { initialRows: BarcodeRow[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [search, setSearch] = React.useState(searchParams.get("search") || "")
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"create" | "edit">("create")
  const [selectedRow, setSelectedRow] = React.useState<BarcodeRow | null>(null)

  // URL Handling
  const debouncedSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set("search", value)
    else params.delete("search")
    router.push(`?${params.toString()}`, { scroll: false })
  }, 500)

  const openCreate = () => {
    setMode("create")
    setSelectedRow(null)
    setIsSheetOpen(true)
  }

  const openEdit = (row: BarcodeRow) => {
    setMode("edit")
    setSelectedRow(row)
    setIsSheetOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Barcode Manager</h2>
        <p className="text-muted-foreground text-sm">
          Kelola barcode produk untuk mempercepat proses scan saat pembelian, stok opname, dan POS.
        </p>
      </div>

      {/* CONTROL BAR - Aligned with Units Pattern */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari barcode atau nama obat..."
            className="pl-9 pr-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              debouncedSearch(e.target.value)
            }}
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
              onClick={() => {
                setSearch("")
                debouncedSearch("")
              }}
            >
              <XIcon className="size-3" />
            </Button>
          )}
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="mr-2 size-4" />
          Tambah Barcode
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="pl-6 w-[200px]">Barcode</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]">Update Terakhir</TableHead>
                <TableHead className="w-[80px] text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                    Belum ada barcode yang terdaftar.
                  </TableCell>
                </TableRow>
              ) : (
                initialRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <BarcodeIcon className="size-3 text-muted-foreground shrink-0" />
                        <span className="font-mono text-xs font-bold tracking-tight text-primary">
                          {row.barcode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link2Icon className="size-3 text-muted-foreground/30 shrink-0" />
                        <span className="font-medium text-sm tracking-tight">{row.medicine}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 uppercase tracking-wider text-muted-foreground border-muted-foreground/30 bg-muted/20">
                        {row.format}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={row.status === "Aktif" ? "secondary" : "outline"} 
                        className={`text-[10px] font-bold px-1.5 py-0 uppercase tracking-wider ${row.status === "Aktif" ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" : "text-muted-foreground"}`}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{row.updatedAt}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuLabel>Opsi Barcode</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEdit(row)}>
                            <PencilIcon className="mr-2 size-4" />
                            Edit Barcode
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <TrashIcon className="mr-2 size-4" />
                            Hapus Barcode
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* SHEET - Aligned with Units Pattern */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <div className="flex h-full flex-col">
            <SheetHeader className="shrink-0 border-b px-6 py-4">
              <SheetTitle className="text-xl font-bold">
                {mode === "create" ? "Tambah Barcode" : "Edit Barcode"}
              </SheetTitle>
              <SheetDescription>
                Hubungkan barcode ke produk obat agar identifikasi item lebih cepat dan akurat.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-6">
                  <div className="grid gap-2">
                    <Label htmlFor="barcode">Kode Barcode <span className="text-destructive">*</span></Label>
                    <Input id="barcode" placeholder="Contoh: 8999908001001" defaultValue={selectedRow?.barcode} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="medicine">Produk Obat <span className="text-destructive">*</span></Label>
                    <Input id="medicine" placeholder="Contoh: Paracetamol 500mg" defaultValue={selectedRow?.medicine} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="format">Format</Label>
                      <Input id="format" defaultValue={selectedRow?.format || "EAN-13"} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Input id="status" defaultValue={selectedRow?.status || "Aktif"} />
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>

            <SheetFooter className="mt-0 flex shrink-0 flex-row items-center justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" className="flex-1" onClick={() => setIsSheetOpen(false)}>
                Batal
              </Button>
              <Button className="flex-1">
                {mode === "create" ? "Tambah Barcode" : "Simpan Perubahan"}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
