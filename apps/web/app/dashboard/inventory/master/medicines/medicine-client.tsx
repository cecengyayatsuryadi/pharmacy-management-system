"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MoreHorizontalIcon, 
  SearchIcon, 
  XIcon,
  DownloadIcon,
  UploadIcon,
  EyeIcon,
  FileTextIcon,
  ActivityIcon,
  StethoscopeIcon,
  PillIcon,
  FingerprintIcon,
  TagIcon,
  LayersIcon
} from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import { format } from "date-fns"
import { id } from "date-fns/locale"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Badge } from "@workspace/ui/components/badge"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  createMedicineAction,
  updateMedicineAction,
  deleteMedicineAction,
} from "@/lib/actions/medicine"
import { MedicineStockBadge } from "@/components/medicine-stock-badge"
import type { Medicine, Category, MedicineGroup, Unit } from "@workspace/database"
import { useSearchParams, useRouter } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { ScrollArea } from "@workspace/ui/components/scroll-area"

interface MedicineClientProps {
  initialData: (Medicine & { category: Category, group: MedicineGroup | null, baseUnit: Unit | null })[]
  categories: Category[]
  medicineGroups: MedicineGroup[]
  units: Unit[]
  metadata: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Mohon tunggu..." : label}
    </Button>
  )
}

export function MedicineClient({ initialData, categories, medicineGroups, units, metadata }: MedicineClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentPage = Number(searchParams.get("page")) || 1
  const [searchValue, setSearchValue] = React.useState(searchParams.get("search") || "")

  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"create" | "edit">("create")
  const [selectedMedicine, setSelectedMedicine] = React.useState<(Medicine & { category: Category, group: MedicineGroup | null, baseUnit: Unit | null }) | null>(
    null
  )

  const debouncedSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }, 500)

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

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

  async function handleSubmit(formData: FormData) {
    let result
    if (mode === "create") {
      result = await createMedicineAction(null, formData)
    } else if (selectedMedicine) {
      result = await updateMedicineAction(selectedMedicine.id, null, formData)
    }

    if (result?.success) {
      toast.success(result.message)
      setIsSheetOpen(false)
    } else {
      toast.error(result?.message || "Terjadi kesalahan")
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Apakah Anda yakin ingin menghapus data obat ini?")) {
      const result = await deleteMedicineAction(id)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    }
  }

  const openCreate = () => {
    setMode("create")
    setSelectedMedicine(null)
    setIsSheetOpen(true)
  }

  const openEdit = (medicine: any) => {
    setMode("edit")
    setSelectedMedicine(medicine)
    setIsSheetOpen(true)
  }

  const openDetail = (medicine: any) => {
    setSelectedMedicine(medicine)
    setIsDetailOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Obat</h2>
          <p className="text-muted-foreground">
            Kelola katalog obat, informasi medis, dan stok minimum apotek.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden md:flex">
            <DownloadIcon className="mr-2 size-4" />
            Export
          </Button>
          <Button variant="outline" className="hidden md:flex">
            <UploadIcon className="mr-2 size-4" />
            Import
          </Button>
          <Button onClick={openCreate}>
            <PlusIcon className="mr-2 size-4" />
            Tambah Obat
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama, generik, atau kode obat..."
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
        <div className="flex flex-wrap items-center gap-2">
          <Select
            defaultValue={searchParams.get("categoryId") || "all"}
            onValueChange={(v) => handleFilterChange("categoryId", v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            defaultValue={searchParams.get("groupId") || "all"}
            onValueChange={(v) => handleFilterChange("groupId", v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Golongan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Golongan</SelectItem>
              {medicineGroups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            defaultValue={searchParams.get("status") || "all"}
            onValueChange={(v) => handleFilterChange("status", v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Non-aktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[120px]">Kode</TableHead>
                <TableHead>Nama Obat / Generik</TableHead>
                <TableHead>Kategori / Golongan</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="text-center">Stok</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[80px] text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    {searchValue || searchParams.get("categoryId") 
                      ? "Tidak ada obat yang sesuai dengan pencarian." 
                      : "Belum ada data obat."}
                  </TableCell>
                </TableRow>
              ) : (
                initialData.map((medicine) => (
                  <TableRow key={medicine.id}>
                    <TableCell className="font-mono text-[11px] font-semibold text-primary">
                      <div className="flex items-center gap-1.5">
                        <FingerprintIcon className="size-3 text-primary/40 shrink-0" />
                        {medicine.code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <PillIcon className="size-3 text-muted-foreground/40 shrink-0" />
                          <span className="font-semibold text-sm tracking-tight">{medicine.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground italic pl-5">
                          {medicine.genericName || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <Badge 
                          variant="outline" 
                          className="w-fit text-[9px] py-0 px-1.5 uppercase font-bold rounded-[4px] gap-1"
                          style={{ 
                            borderColor: medicine.category.color, 
                            color: medicine.category.color,
                            backgroundColor: `${medicine.category.color}10`
                          }}
                        >
                          <TagIcon className="size-2.5 opacity-70" />
                          {medicine.category.name}
                        </Badge>
                        {medicine.group ? (
                          <Badge 
                            variant="outline" 
                            className="w-fit text-[9px] py-0 px-1.5 uppercase font-bold rounded-full gap-1"
                            style={{ 
                              borderColor: medicine.group.color, 
                              color: medicine.group.color,
                              backgroundColor: `${medicine.group.color}10`
                            }}
                          >
                            <LayersIcon className="size-2.5 opacity-70" />
                            {medicine.group.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="w-fit text-[9px] py-0 px-1.5 uppercase font-bold text-muted-foreground border-muted-foreground/30 rounded-full gap-1">
                            <LayersIcon className="size-2.5 opacity-50" />
                            {medicine.classification || "Bebas"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      Rp {Number(medicine.price).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold tabular-nums">
                          {medicine.stock} <span className="text-[9px] font-medium text-muted-foreground/70 uppercase">{medicine.baseUnit?.abbreviation || medicine.unit}</span>
                        </span>
                        <MedicineStockBadge stock={medicine.stock} minStock={medicine.minStock} className="h-4.5 text-[9px] px-1.5" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={medicine.isActive ? "success" : "secondary"} className="h-5 text-[10px]">
                        {medicine.isActive ? "Aktif" : "Non-aktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[160px]">
                          <DropdownMenuLabel>Opsi Data</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDetail(medicine)}>
                            <EyeIcon className="mr-2 size-4" />
                            Detail Lengkap
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(medicine)}>
                            <PencilIcon className="mr-2 size-4" />
                            Edit Data Obat
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onClick={() => handleDelete(medicine.id)}
                          >
                            <TrashIcon className="mr-2 size-4" />
                            Hapus Data
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

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
          <form action={handleSubmit} className="flex h-full flex-col">
            <SheetHeader className="shrink-0 border-b px-6 py-4">
              <SheetTitle className="text-xl font-bold">
                {mode === "create" ? "Tambah Obat Baru" : "Edit Data Obat"}
              </SheetTitle>
            </SheetHeader>

            <Tabs defaultValue="basic" className="flex flex-1 flex-col overflow-hidden">
              <div className="shrink-0 border-b bg-muted/20 px-6 py-2">
                <TabsList className="h-9 w-full justify-start gap-4 bg-transparent p-0">
                  <TabsTrigger
                    value="basic"
                    className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    Info Dasar
                  </TabsTrigger>
                  <TabsTrigger
                    value="medical"
                    className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    Info Medis
                  </TabsTrigger>
                  <TabsTrigger
                    value="logistics"
                    className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    Harga & Stok
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-6 p-6 pb-12">
                    <TabsContent value="basic" className="m-0 space-y-4 outline-none">
                      <div className="grid gap-2">
                        <Label htmlFor="name">
                          Nama Obat <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={selectedMedicine?.name}
                          placeholder="Contoh: Paracetamol 500mg"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="genericName">Nama Generik</Label>
                        <Input
                          id="genericName"
                          name="genericName"
                          defaultValue={selectedMedicine?.genericName || ""}
                          placeholder="Contoh: Paracetamol"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="categoryId">
                            Kategori <span className="text-destructive">*</span>
                          </Label>
                          <Select name="categoryId" defaultValue={selectedMedicine?.categoryId} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="groupId">
                            Golongan Obat <span className="text-destructive">*</span>
                          </Label>
                          <Select name="groupId" defaultValue={selectedMedicine?.groupId || ""} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Golongan" />
                            </SelectTrigger>
                            <SelectContent>
                              {medicineGroups.map((g) => (
                                <SelectItem key={g.id} value={g.id}>
                                  {g.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="code">Kode Obat (Internal)</Label>
                          <Input
                            id="code"
                            name="code"
                            defaultValue={selectedMedicine?.code || ""}
                            placeholder="MED-XXXXX (Otomatis)"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="sku">SKU / Barcode</Label>
                          <Input
                            id="sku"
                            name="sku"
                            defaultValue={selectedMedicine?.sku || ""}
                            placeholder="Tempel barcode di sini"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Deskripsi Singkat</Label>
                        <Textarea
                          id="description"
                          name="description"
                          defaultValue={selectedMedicine?.description || ""}
                          placeholder="Keterangan tambahan..."
                          className="h-20"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          name="isActive"
                          defaultChecked={selectedMedicine?.isActive ?? true}
                          value="true"
                          className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="isActive" className="cursor-pointer">
                          Status Aktif (Tampilkan di POS & Laporan)
                        </Label>
                      </div>
                    </TabsContent>

                    <TabsContent value="medical" className="m-0 space-y-4 outline-none">
                      <div className="grid gap-2">
                        <Label htmlFor="composition">Komposisi</Label>
                        <Textarea
                          id="composition"
                          name="composition"
                          defaultValue={selectedMedicine?.composition || ""}
                          placeholder="Kandungan bahan aktif..."
                          className="h-24"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="indication">Indikasi</Label>
                        <Textarea
                          id="indication"
                          name="indication"
                          defaultValue={selectedMedicine?.indication || ""}
                          placeholder="Kegunaan obat..."
                          className="h-20"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="contraindication">Kontraindikasi</Label>
                        <Textarea
                          id="contraindication"
                          name="contraindication"
                          defaultValue={selectedMedicine?.contraindication || ""}
                          placeholder="Kondisi yang dilarang..."
                          className="h-20"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="sideEffects">Efek Samping</Label>
                        <Textarea
                          id="sideEffects"
                          name="sideEffects"
                          defaultValue={selectedMedicine?.sideEffects || ""}
                          placeholder="Efek samping yang mungkin muncul..."
                          className="h-20"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="manufacturer">Produsen (Pabrik)</Label>
                          <Input
                            id="manufacturer"
                            name="manufacturer"
                            defaultValue={selectedMedicine?.manufacturer || ""}
                            placeholder="Contoh: Kimia Farma"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="distributor">Distributor Utama</Label>
                          <Input
                            id="distributor"
                            name="distributor"
                            defaultValue={selectedMedicine?.distributor || ""}
                            placeholder="Contoh: PBF X"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="logistics" className="m-0 space-y-4 outline-none">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="baseUnitId">
                            Satuan Terkecil <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            name="baseUnitId"
                            defaultValue={selectedMedicine?.baseUnitId || undefined}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Satuan" />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.name} ({u.abbreviation})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="stock">Stok Awal Saat Ini</Label>
                          <Input
                            id="stock"
                            name="stock"
                            type="number"
                            defaultValue={selectedMedicine?.stock || "0"}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="purchasePrice">
                            Harga Beli Dasar (Rp) <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="purchasePrice"
                            name="purchasePrice"
                            type="number"
                            defaultValue={selectedMedicine?.purchasePrice || "0"}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="price">
                            Harga Jual (Rp) <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="price"
                            name="price"
                            type="number"
                            defaultValue={selectedMedicine?.price || "0"}
                            required
                          />
                        </div>
                      </div>                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="minStock">Batas Stok Minimum</Label>
                          <Input
                            id="minStock"
                            name="minStock"
                            type="number"
                            defaultValue={selectedMedicine?.minStock || "10"}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="maxStock">Kapasitas Maksimum</Label>
                          <Input
                            id="maxStock"
                            name="maxStock"
                            type="number"
                            defaultValue={selectedMedicine?.maxStock || "1000"}
                            required
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </div>
            </Tabs>

            <SheetFooter className="mt-0 flex shrink-0 flex-row items-center justify-end gap-3 border-t px-6 py-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsSheetOpen(false)}>
                Batal
              </Button>
              <div className="flex-1">
                <SubmitButton
                  label={mode === "create" ? "Tambah Data Obat" : "Simpan Perubahan"}
                />
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* DETAIL SHEET: READ-ONLY */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col gap-0">
          <div className="flex flex-col flex-1 h-full overflow-hidden">
            <SheetHeader className="shrink-0 border-b bg-muted/20 px-6 py-4">
              <div className="mb-1 flex items-center gap-3">
                <Badge className="font-mono text-[10px]">{selectedMedicine?.code}</Badge>
                <Badge variant={selectedMedicine?.isActive ? "success" : "secondary"} className="h-5 text-[10px]">
                  {selectedMedicine?.isActive ? "Aktif" : "Non-aktif"}
                </Badge>
              </div>
              <SheetTitle className="pr-8 text-xl font-bold leading-none tracking-tight sm:text-2xl">
                {selectedMedicine?.name}
              </SheetTitle>
              <p className="mt-1 line-clamp-1 text-sm italic text-muted-foreground">
                {selectedMedicine?.genericName || "Nama generik tidak tersedia"}
              </p>
            </SheetHeader>
            
            <Tabs defaultValue="medical-info" className="flex flex-1 flex-col overflow-hidden">
              <div className="shrink-0 border-b bg-muted/20 px-6 py-2">
                <TabsList className="h-9 w-full justify-start gap-4 bg-transparent p-0">
                  <TabsTrigger
                    value="medical-info"
                    className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    Informasi Medis
                  </TabsTrigger>
                  <TabsTrigger
                    value="logistics-info"
                    className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    Logistik & Deskripsi
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-6 pb-12">
                    {/* Section 1: Ringkasan Harga & Stok (Always Visible) */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 rounded-xl border bg-emerald-50/30 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                        <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1">Stok Saat Ini</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{selectedMedicine?.stock}</span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase">{selectedMedicine?.baseUnit?.abbreviation || selectedMedicine?.unit}</span>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl border bg-primary/5 dark:bg-primary/10 dark:border-primary/20">
                        <p className="text-[10px] uppercase font-bold text-primary dark:text-primary mb-1">Harga Jual</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-primary">{Number(selectedMedicine?.price).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                    <TabsContent value="medical-info" className="m-0 outline-none space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                          <StethoscopeIcon className="size-4 text-primary" />
                          <h3 className="font-bold text-sm uppercase tracking-wider">Detil Medis</h3>
                        </div>
                        <div className="grid gap-6">
                          <div>
                            <Label className="text-[10px] uppercase text-muted-foreground">Komposisi</Label>
                            <p className="text-sm mt-1 leading-relaxed">{selectedMedicine?.composition || "-"}</p>
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase text-muted-foreground">Indikasi / Kegunaan</Label>
                            <p className="text-sm mt-1 leading-relaxed">{selectedMedicine?.indication || "-"}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-[10px] uppercase text-muted-foreground">Produsen</Label>
                              <p className="text-sm mt-1 font-semibold">{selectedMedicine?.manufacturer || "-"}</p>
                            </div>
                            <div>
                              <Label className="text-[10px] uppercase text-muted-foreground">Golongan</Label>
                              <p className="text-sm mt-1 font-semibold">{selectedMedicine?.classification || "-"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="logistics-info" className="m-0 outline-none space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                          <FileTextIcon className="size-4 text-primary" />
                          <h3 className="font-bold text-sm uppercase tracking-wider">Detail Logistik</h3>
                        </div>
                        <div className="grid gap-4 text-sm">
                          <div className="flex justify-between py-1 border-b border-dashed">
                            <span className="text-muted-foreground">Kategori</span>
                            <span className="font-medium">{selectedMedicine?.category.name}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-dashed">
                            <span className="text-muted-foreground">Satuan Dasar</span>
                            <span className="font-medium uppercase">{selectedMedicine?.baseUnit?.name} ({selectedMedicine?.baseUnit?.abbreviation})</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-dashed">
                            <span className="text-muted-foreground">Min. Stock / Reorder Point</span>
                            <span className="font-medium tabular-nums text-orange-600">{selectedMedicine?.minStock}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-dashed">
                            <span className="text-muted-foreground">Max. Stock Capacity</span>
                            <span className="font-medium tabular-nums">{selectedMedicine?.maxStock}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-dashed">
                            <span className="text-muted-foreground">Barcode / SKU</span>
                            <span className="font-mono text-xs">{selectedMedicine?.sku || "-"}</span>
                          </div>
                          <div className="pt-2">
                            <Label className="text-[10px] uppercase text-muted-foreground">Deskripsi Keterangan</Label>
                            <p className="mt-1 text-muted-foreground">{selectedMedicine?.description || "Tidak ada deskripsi"}</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </div>
            </Tabs>
            
            <SheetFooter className="px-6 py-4 border-t shrink-0 mt-0">
              <Button className="w-full" onClick={() => setIsDetailOpen(false)}>Tutup Detail</Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
