"use client"

import * as React from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useSearchParams, useRouter } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { 
  Check, 
  ChevronsUpDown, 
  PlusIcon,
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCcw,
  SearchIcon,
  XIcon
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Badge } from "@workspace/ui/components/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@workspace/ui/components/dialog"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@workspace/ui/components/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { toast } from "@workspace/ui/components/sonner"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import { createStockMovementAction } from "@/lib/actions/inventory"
import { getBatchesAction } from "@/lib/actions/batch"
import type { Medicine, StockMovement, User, Supplier, Warehouse, MedicineBatch } from "@workspace/database"

type InventoryMovementRow = {
  id: string
  type: string
  quantity: string
  resultingStock: string
  reference: string | null
  note: string | null
  createdAt: Date
  purchaseNumber?: string | null
  invoiceNumber?: string | null
  medicine: {
    id: string
    name: string
    sku: string | null
    unit: string
    stock: string
  }
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  warehouse: {
    id: string
    name: string
  } | null
  batch: {
    id: string
    batchNumber: string
    expiryDate: Date
  } | null
  supplier?: {
    id: string
    name: string
    code: string
  } | null
}

interface InventoryClientProps {
  medicines: Medicine[]
  suppliers?: Supplier[]
  warehouses?: Warehouse[]
  primarySupplierByMedicine?: Record<string, string>
  initialMovements: InventoryMovementRow[]
  metadata: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  defaultType: "in" | "out" | "adjustment"
  title: string
  submitAction?: (prevState: any, formData: FormData) => Promise<any>
  showPurchaseColumns?: boolean
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Mohon tunggu..." : label}
    </Button>
  )
}

export function InventoryClient({ 
  medicines, 
  suppliers = [], 
  warehouses = [],
  primarySupplierByMedicine = {}, 
  initialMovements, 
  metadata, 
  defaultType, 
  title,
  submitAction,
  showPurchaseColumns = false
}: InventoryClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentPage = Number(searchParams.get("page")) || 1
  const [mounted, setMounted] = React.useState(false)
  const [state, formAction] = useActionState(
    submitAction ?? createStockMovementAction,
    null
  )
  const [isOpen, setIsOpen] = React.useState(false)
  const [isComboOpen, setIsComboOpen] = React.useState(false)
  const [selectedMedicineId, setSelectedMedicineId] = React.useState("")
  const [availableBatches, setAvailableBatches] = React.useState<any[]>([])
  const [isLoadingBatches, setIsLoadingBatches] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState(searchParams.get("search") || "")
  const formRef = React.useRef<HTMLFormElement>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (selectedMedicineId && (defaultType === "out" || defaultType === "adjustment")) {
      setIsLoadingBatches(true)
      getBatchesAction(selectedMedicineId).then(batches => {
        setAvailableBatches(batches)
        setIsLoadingBatches(false)
      })
    }
  }, [selectedMedicineId, defaultType])

  React.useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
      setIsOpen(false)
      formRef.current?.reset()
      setSelectedMedicineId("")
      setAvailableBatches([])
    } else if (state?.message) {
      toast.error(state.message)
    }
  }, [state])

  const debouncedSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }
    params.set("page", "1") // Reset to page 1 on search
    router.push(`?${params.toString()}`)
  }, 500)

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`?${params.toString()}`)
  }

  const clearSearch = () => {
    setSearchValue("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-4">
      {/* HEADER AREA */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">
          Kelola dan pantau riwayat mutasi stok apotek Anda.
        </p>
      </div>

      {/* SEARCH & ACTION AREA (SEJAJAR) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari riwayat obat atau referensi..."
            className="pl-9 pr-10"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value)
              debouncedSearch(e.target.value)
            }}
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
              onClick={clearSearch}
            >
              <XIcon className="size-3" />
            </Button>
          )}
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon data-icon="inline-start" />
              Catat {title}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Form {title}</DialogTitle>
              <DialogDescription>
                Input data mutasi stok dengan benar untuk menjaga akurasi data inventori.
              </DialogDescription>
            </DialogHeader>
            <form ref={formRef} action={formAction} className="grid gap-4 py-4">
              <input type="hidden" name="medicineId" value={selectedMedicineId} />
              <input type="hidden" name="type" value={defaultType} />
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Pilih Obat</Label>
                  <Popover open={isComboOpen} onOpenChange={setIsComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isComboOpen}
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate">
                          {selectedMedicineId
                            ? medicines.find((m) => m.id === selectedMedicineId)?.name
                            : "Cari obat..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Ketik nama obat..." />
                        <CommandList>
                          <CommandEmpty>Obat tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {medicines.map((medicine) => (
                              <CommandItem
                                key={medicine.id}
                                value={medicine.name}
                                onSelect={() => {
                                  setSelectedMedicineId(medicine.id)
                                  setIsComboOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedMedicineId === medicine.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{medicine.name}</span>
                                  <span className="text-xs text-muted-foreground">SKU: {medicine.sku || "-"} | Stok: {medicine.stock}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="warehouseId">Pilih Gudang</Label>
                  <Select name="warehouseId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Lokasi" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {suppliers.length > 0 && defaultType === "in" && (
                <div className="grid gap-2">
                  <Label htmlFor="supplierId">Pilih Supplier</Label>
                  <Select 
                    name="supplierId" 
                    defaultValue={selectedMedicineId ? primarySupplierByMedicine[selectedMedicineId] : undefined}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {defaultType === "in" ? (
                <div className="grid grid-cols-2 gap-4 border p-3 rounded-lg bg-muted/20">
                  <div className="grid gap-2">
                    <Label htmlFor="batchNumber">Nomor Batch (Opsional)</Label>
                    <Input id="batchNumber" name="batchNumber" placeholder="MISAL: B-123" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expiryDate">Kadaluarsa</Label>
                    <Input id="expiryDate" name="expiryDate" type="date" />
                  </div>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="batchId">Pilih Batch {isLoadingBatches && <span className="text-[10px] animate-pulse">(Loading...)</span>}</Label>
                  <Select name="batchId" required={defaultType === "out"}>
                    <SelectTrigger>
                      <SelectValue placeholder={availableBatches.length > 0 ? "Pilih Batch & Gudang" : "Tidak ada batch tersedia"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBatches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.batchNumber} - {b.warehouseName} (Stok: {b.totalQuantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">
                    {defaultType === "adjustment" ? "Stok Nyata" : "Jumlah Transaksi"}
                  </Label>
                  <Input 
                    id="quantity" 
                    name="quantity" 
                    type="number" 
                    placeholder="0" 
                    required 
                    min={defaultType === "adjustment" ? "0" : "1"}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reference">No. Referensi</Label>
                  <Input id="reference" name="reference" placeholder="Faktur/Nota" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="note">Keterangan / Alasan</Label>
                <Input 
                  id="note" 
                  name="note" 
                  placeholder={
                    defaultType === "in" ? "Misal: Stok datang dari PBF" :
                    defaultType === "out" ? "Misal: Obat rusak/kadaluwarsa" :
                    "Misal: Selisih perhitungan stok rutin"
                  } 
                />
              </div>

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
                <SubmitButton label={`Simpan ${title}`} />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* TABLE AREA */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nama Obat</TableHead>
                <TableHead>Gudang</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Perubahan</TableHead>
                <TableHead className="text-right">Stok Akhir</TableHead>
                <TableHead>Oleh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    {searchValue ? "Tidak ada riwayat yang sesuai pencarian." : `Belum ada catatan ${title.toLowerCase()}.`}
                  </TableCell>
                </TableRow>
              ) : (
                initialMovements.map((move) => (
                  <TableRow key={move.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(new Date(move.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{move.medicine.name}</span>
                        <span className="text-[10px] text-muted-foreground">SKU: {move.medicine.sku || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {move.warehouse?.name || "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {move.batch?.batchNumber || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs">{move.note || "Tanpa keterangan"}</span>
                        {move.reference && (
                          <span className="text-[10px] text-primary font-mono">{move.reference}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      <div className="flex items-center justify-end gap-1.5">
                        {move.type === "in" && (
                          <>
                            <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
                            <span className="text-emerald-600">+{move.quantity}</span>
                          </>
                        )}
                        {move.type === "out" && (
                          <>
                            <ArrowDownCircle className="h-4 w-4 text-red-600" />
                            <span className="text-red-600">{move.quantity}</span>
                          </>
                        )}
                        {move.type === "adjustment" && (
                          <>
                            <RefreshCcw className="h-4 w-4 text-amber-600" />
                            <span className={cn(
                              Number(move.quantity) >= 0 ? "text-emerald-600" : "text-red-600"
                            )}>
                              {Number(move.quantity) > 0 ? `+${move.quantity}` : move.quantity}
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {move.resultingStock}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal text-[10px]">
                        {move.user.name}
                      </Badge>
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
                  if (currentPage > 1) handlePageChange(currentPage - 1)
                }}
              />
            </PaginationItem>
            {Array.from({ length: metadata.totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === i + 1}
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
                  if (currentPage < metadata.totalPages)
                    handlePageChange(currentPage + 1)
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
