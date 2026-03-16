"use client"

import * as React from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { PlusIcon, PencilIcon, TrashIcon, MoreHorizontalIcon, AlertTriangleIcon } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import { format, isPast, isWithinInterval, addDays } from "date-fns"

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
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
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Badge } from "@workspace/ui/components/badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import {
  createMedicineAction,
  updateMedicineAction,
  deleteMedicineAction,
} from "@/lib/actions/medicine"
import type { Medicine, Category } from "@workspace/database"
import { useSearchParams, useRouter } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { SearchIcon, XIcon } from "lucide-react"

interface MedicineClientProps {
  initialData: (Medicine & { category: Category })[]
  categories: Category[]
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
    <Button type="submit" disabled={pending}>
      {pending ? "Mohon tunggu..." : label}
    </Button>
  )
}

export function MedicineClient({ initialData, categories, metadata }: MedicineClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentPage = Number(searchParams.get("page")) || 1
  const [searchValue, setSearchValue] = React.useState(searchParams.get("search") || "")

  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [selectedMedicine, setSelectedMedicine] = React.useState<(Medicine & { category: Category }) | null>(
    null
  )

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

  const handleCategoryFilter = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (id && id !== "all") {
      params.set("categoryId", id)
    } else {
      params.delete("categoryId")
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

  async function handleCreate(formData: FormData) {
    const result = await createMedicineAction(null, formData)
    if (result.success) {
      toast.success(result.message)
      setIsAddOpen(false)
    } else {
      toast.error(result.message)
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!selectedMedicine) return
    const result = await updateMedicineAction(selectedMedicine.id, null, formData)
    if (result.success) {
      toast.success(result.message)
      setIsEditOpen(false)
    } else {
      toast.error(result.message)
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

  const getExpiryStatus = (date: Date | null) => {
    if (!date) return null
    const expiryDate = new Date(date)
    if (isPast(expiryDate)) {
      return <Badge variant="destructive">Kadaluarsa</Badge>
    }
    if (isWithinInterval(expiryDate, { start: new Date(), end: addDays(new Date(), 90) })) {
      return (
        <Badge variant="outline" className="text-orange-500 border-orange-500">
          <AlertTriangleIcon className="mr-1 size-3" />
          Hampir Kadaluarsa
        </Badge>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Obat</h2>
          <p className="text-muted-foreground">
            Kelola stok dan informasi obat-obatan di apotek Anda.
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon data-icon="inline-start" />
              Tambah Obat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form action={handleCreate}>
              <DialogHeader>
                <DialogTitle>Tambah Obat Baru</DialogTitle>
                <DialogDescription>
                  Lengkapi informasi detail obat untuk inventori.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Obat</Label>
                  <Input id="name" name="name" placeholder="Contoh: Paracetamol 500mg" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="categoryId">Kategori</Label>
                  <Select name="categoryId" required>
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
                  <Label htmlFor="sku">SKU / Kode Obat</Label>
                  <Input id="sku" name="sku" placeholder="Contoh: PCT-001" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">Satuan</Label>
                  <Select name="unit" defaultValue="pcs">
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Satuan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pcs / Biji</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="strip">Strip</SelectItem>
                      <SelectItem value="botol">Botol</SelectItem>
                      <SelectItem value="box">Box / Dus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purchasePrice">Harga Beli (Rp)</Label>
                  <Input id="purchasePrice" name="purchasePrice" type="number" placeholder="0" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Harga Jual (Rp)</Label>
                  <Input id="price" name="price" type="number" placeholder="0" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stok Awal</Label>
                  <Input id="stock" name="stock" type="number" placeholder="0" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="minStock">Stok Minimum</Label>
                  <Input id="minStock" name="minStock" type="number" placeholder="5" required />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="expiryDate">Tanggal Kadaluarsa</Label>
                  <Input id="expiryDate" name="expiryDate" type="date" />
                </div>
              </div>
              <DialogFooter>
                <SubmitButton label="Simpan Data Obat" />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama obat atau SKU..."
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
        <Select
          defaultValue={searchParams.get("categoryId") || "all"}
          onValueChange={handleCategoryFilter}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter Kategori" />
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
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Obat</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Kadaluarsa</TableHead>
                <TableHead className="w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {searchValue || searchParams.get("categoryId") 
                      ? "Tidak ada obat yang sesuai dengan pencarian." 
                      : "Belum ada data obat."}
                  </TableCell>
                </TableRow>
              ) : (
                initialData.map((medicine) => (
                  <TableRow key={medicine.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{medicine.name}</span>
                        <span className="text-xs text-muted-foreground">{medicine.sku || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{medicine.category.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{medicine.stock} {medicine.unit}</span>
                        {Number(medicine.stock) <= Number(medicine.minStock) && (
                          <Badge variant="outline" className="w-fit text-red-500 border-red-500 bg-red-50">
                            Stok Rendah
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      Rp {Number(medicine.price).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">
                          {medicine.expiryDate 
                            ? format(new Date(medicine.expiryDate), "dd MMM yyyy") 
                            : "-"}
                        </span>
                        {getExpiryStatus(medicine.expiryDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMedicine(medicine)
                              setIsEditOpen(true)
                            }}
                          >
                            <PencilIcon className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(medicine.id)}
                          >
                            <TrashIcon className="mr-2 size-4" />
                            Hapus
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

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <form action={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Data Obat</DialogTitle>
              <DialogDescription>
                Perbarui informasi stok atau harga obat.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nama Obat</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={selectedMedicine?.name}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-categoryId">Kategori</Label>
                <Select name="categoryId" defaultValue={selectedMedicine?.categoryId}>
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
                <Label htmlFor="edit-sku">SKU / Kode Obat</Label>
                <Input
                  id="edit-sku"
                  name="sku"
                  defaultValue={selectedMedicine?.sku || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-unit">Satuan</Label>
                <Select name="unit" defaultValue={selectedMedicine?.unit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pcs / Biji</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="strip">Strip</SelectItem>
                    <SelectItem value="botol">Botol</SelectItem>
                    <SelectItem value="box">Box / Dus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-purchasePrice">Harga Beli (Rp)</Label>
                <Input
                  id="edit-purchasePrice"
                  name="purchasePrice"
                  type="number"
                  defaultValue={selectedMedicine?.purchasePrice}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Harga Jual (Rp)</Label>
                <Input
                  id="edit-price"
                  name="price"
                  type="number"
                  defaultValue={selectedMedicine?.price}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-stock">Stok</Label>
                <Input
                  id="edit-stock"
                  name="stock"
                  type="number"
                  defaultValue={selectedMedicine?.stock}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-minStock">Stok Minimum</Label>
                <Input
                  id="edit-minStock"
                  name="minStock"
                  type="number"
                  defaultValue={selectedMedicine?.minStock}
                  required
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="edit-expiryDate">Tanggal Kadaluarsa</Label>
                <Input
                  id="edit-expiryDate"
                  name="expiryDate"
                  type="date"
                  defaultValue={selectedMedicine?.expiryDate 
                    ? format(new Date(selectedMedicine.expiryDate), "yyyy-MM-dd") 
                    : ""}
                />
              </div>

            </div>
            <DialogFooter>
              <SubmitButton label="Simpan Perubahan" />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
