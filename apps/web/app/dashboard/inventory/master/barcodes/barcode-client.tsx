"use client"

import * as React from "react"
import { 
  PlusIcon, 
  SearchIcon, 
  MoreHorizontalIcon, 
  PencilIcon, 
  TrashIcon, 
  XIcon, 
  BarcodeIcon, 
  Link2Icon,
  PrinterIcon,
  Loader2Icon,
  HistoryIcon
} from "lucide-react"
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import { useSearchParams, useRouter } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { updateBarcodeAction, deleteBarcodeAction } from "@/lib/actions/barcode"
import { toast } from "sonner"

type BarcodeRow = {
  id: string
  barcode: string
  medicine: string
  format: string
  status: string
  updatedAt: string
}

interface Metadata {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function BarcodeClient({ initialRows, metadata }: { initialRows: BarcodeRow[], metadata: Metadata }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [search, setSearch] = React.useState(searchParams.get("search") || "")
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"create" | "edit">("create")
  const [selectedRow, setSelectedRow] = React.useState<BarcodeRow | null>(null)
  
  // React 19 Action States
  const [state, action, isPending] = React.useActionState(updateBarcodeAction, null)

  // URL Handling
  const debouncedSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set("search", value)
    else params.delete("search")
    params.set("page", "1") // Reset to page 1 on new search
    router.push(`?${params.toString()}`, { scroll: false })
  }, 500)

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPage.toString())
    router.push(`?${params.toString()}`)
  }

  // Handle Success/Error from Server Actions
  React.useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
      setIsSheetOpen(false)
    } else if (state?.success === false) {
      toast.error(state.message)
    }
  }, [state])

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

  const handleDelete = async (id: string) => {
    if (confirm("Hapus barcode ini dari produk?")) {
      const res = await deleteBarcodeAction(id)
      if (res.success) toast.success(res.message)
      else toast.error(res.message)
    }
  }

  const handlePrint = (row: BarcodeRow) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Barcode - ${row.medicine}</title>
          <style>
            body { font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .label { border: 1px dashed #ccc; padding: 20px; text-align: center; width: 250px; }
            .name { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
            .barcode { font-family: 'monospace'; font-size: 24px; letter-spacing: 2px; border: 1px solid black; padding: 10px; margin: 10px 0; }
            .code { font-size: 12px; color: #666; }
            @media print {
              body { height: auto; }
              .label { border: none; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="label">
            <div class="name">${row.medicine}</div>
            <div class="barcode">${row.barcode}</div>
            <div class="code">${row.barcode}</div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Barcode Manager</h2>
          <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
            {metadata.total} Produk
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Kelola barcode produk untuk mempercepat proses scan saat pembelian, stok opname, dan POS.
        </p>
      </div>

      {/* CONTROL BAR */}
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
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden md:flex">
            <PrinterIcon className="mr-2 size-4" />
            Cetak Massal
          </Button>
          <Button onClick={openCreate}>
            <PlusIcon className="mr-2 size-4" />
            Assign Barcode
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-hidden rounded-md border-t-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6 w-[220px] font-bold">Barcode / SKU</TableHead>
                <TableHead className="font-bold">Produk Obat</TableHead>
                <TableHead className="w-[120px] font-bold">Format</TableHead>
                <TableHead className="w-[120px] font-bold">Status</TableHead>
                <TableHead className="w-[150px] font-bold">Terdaftar</TableHead>
                <TableHead className="w-[80px] text-center font-bold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <BarcodeIcon className="size-8 opacity-20" />
                      <p className="text-sm">Belum ada barcode yang terdaftar atau data tidak ditemukan.</p>
                      {search && (
                        <Button variant="link" onClick={() => { setSearch(""); debouncedSearch("") }}>
                          Bersihkan Pencarian
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                initialRows.map((row) => (
                  <TableRow key={row.id} className="group hover:bg-muted/10 transition-colors">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2.5">
                        <div className="size-6 rounded flex items-center justify-center bg-primary/5 text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                          <BarcodeIcon className="size-3" />
                        </div>
                        <span className="font-mono text-xs font-bold tracking-tight text-primary uppercase">
                          {row.barcode === "-" ? (
                            <span className="text-muted-foreground/30 italic">Unassigned</span>
                          ) : row.barcode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm tracking-tight leading-none mb-1">{row.medicine}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Link2Icon className="size-2.5" />
                          <span>ID: {row.id.split("-")[0]}...</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className="text-[9px] font-bold px-1.5 py-0 uppercase rounded-[4px] border-muted-foreground/30 bg-muted/5 text-muted-foreground"
                      >
                        {row.format}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={row.status === "Aktif" ? "success" : "secondary"} 
                        className="h-5 text-[10px] px-2"
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      <div className="flex items-center gap-1.5">
                        <HistoryIcon className="size-3" />
                        {row.updatedAt}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 group-hover:bg-background">
                            <MoreHorizontalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                          <DropdownMenuLabel>Opsi Barcode</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handlePrint(row)} disabled={row.barcode === "-"}>
                            <PrinterIcon className="mr-2 size-4" />
                            Cetak Label
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(row)}>
                            <PencilIcon className="mr-2 size-4" />
                            Edit Barcode
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onClick={() => handleDelete(row.id)}
                            disabled={row.barcode === "-"}
                          >
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

      {metadata.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (metadata.page > 1) handlePageChange(metadata.page - 1)
                }}
              />
            </PaginationItem>
            {Array.from({ length: metadata.totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  href="#"
                  isActive={metadata.page === i + 1}
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(i + 1)
                  }}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (metadata.page < metadata.totalPages) handlePageChange(metadata.page + 1)
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* SHEET DIALOG */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <form action={action} className="flex h-full flex-col">
            <SheetHeader className="shrink-0 border-b px-6 py-5 bg-muted/5">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                {mode === "create" ? (
                  <><PlusIcon className="size-5 text-primary" /> Assign Barcode</>
                ) : (
                  <><PencilIcon className="size-5 text-primary" /> Edit Barcode</>
                )}
              </SheetTitle>
              <SheetDescription>
                {mode === "create" 
                  ? "Pilih produk dan masukkan kode barcode untuk mendaftarkannya ke sistem." 
                  : `Ubah barcode untuk produk ${selectedRow?.medicine}.`}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-6">
                  {/* HIDDEN ID FIELD */}
                  <input type="hidden" name="medicineId" value={selectedRow?.id || ""} />

                  <div className="grid gap-2.5">
                    <Label htmlFor="medicine" className="text-sm font-bold">Produk Obat</Label>
                    <div className="relative">
                      <Input 
                        id="medicine" 
                        placeholder="Cari obat..." 
                        readOnly={mode === "edit"}
                        defaultValue={selectedRow?.medicine}
                        className={mode === "edit" ? "bg-muted cursor-not-allowed font-semibold" : ""}
                      />
                      {mode === "edit" && (
                        <Badge variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px]">
                          ID: {selectedRow?.id.split("-")[0]}
                        </Badge>
                      )}
                    </div>
                    {mode === "create" && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 px-1">
                        <Loader2Icon className="size-2.5 animate-spin" />
                        Gunakan fitur cari produk (WIP: Autocomplete)
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2.5">
                    <Label htmlFor="sku" className="text-sm font-bold">Kode Barcode <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <BarcodeIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        id="sku" 
                        name="sku"
                        placeholder="Scan atau ketik kode barcode..." 
                        className="pl-9 font-mono text-base font-bold tracking-widest uppercase focus-visible:ring-primary"
                        defaultValue={selectedRow?.barcode === "-" ? "" : selectedRow?.barcode}
                        required
                        autoFocus
                      />
                    </div>
                    {state?.errors?.sku && (
                      <p className="text-[10px] font-bold text-destructive px-1">{state.errors.sku}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded-md border border-dashed">
                      <strong>Tips:</strong> Klik kolom input di atas lalu scan barcode fisik produk Anda untuk mengisi secara otomatis.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Format Terdeteksi</Label>
                      <Badge variant="outline" className="w-full justify-center h-8 font-mono text-[10px]">
                        {selectedRow?.format || "AUTO-DETECT"}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Tipe Label</Label>
                      <Badge variant="outline" className="w-full justify-center h-8 font-mono text-[10px]">
                        STANDARD (32x18mm)
                      </Badge>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>

            <SheetFooter className="mt-0 flex shrink-0 flex-row items-center justify-end gap-3 border-t px-6 py-4 bg-muted/5">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsSheetOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="flex-1 font-bold shadow-md shadow-primary/20" disabled={isPending}>
                {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                {mode === "create" ? "Simpan Barcode" : "Perbarui Data"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
