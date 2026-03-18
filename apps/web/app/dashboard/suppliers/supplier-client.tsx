"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import { PlusIcon, PencilIcon, TrashIcon, MoreHorizontalIcon } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
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
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import {
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
} from "@/lib/actions/supplier"
import type { Supplier } from "@workspace/database"
import { useSearchParams, useRouter } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { SearchIcon, XIcon } from "lucide-react"

interface SupplierClientProps {
  initialData: Supplier[]
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

export function SupplierClient({ initialData, metadata }: SupplierClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentPage = Number(searchParams.get("page")) || 1
  const [searchValue, setSearchValue] = React.useState(searchParams.get("search") || "")

  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [newSupplierStatus, setNewSupplierStatus] = React.useState("true")
  const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | null>(
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
    const result = await createSupplierAction(null, formData)
    if (result.success) {
      toast.success(result.message)
      setIsAddOpen(false)
    } else {
      toast.error(result.message)
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!selectedSupplier) return
    const result = await updateSupplierAction(selectedSupplier.id, null, formData)
    if (result.success) {
      toast.success(result.message)
      setIsEditOpen(false)
    } else {
      toast.error(result.message)
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Apakah Anda yakin ingin menghapus supplier ini?")) {
      const result = await deleteSupplierAction(id)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Supplier</h2>
          <p className="text-muted-foreground">
            Kelola data supplier untuk kebutuhan pembelian dan stok masuk.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari supplier..."
            aria-label="Cari supplier berdasarkan nama"
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
              aria-label="Bersihkan pencarian supplier"
              onClick={clearSearch}
            >
              <XIcon className="size-3" />
            </Button>
          )}
        </div>
        <div className="md:ml-auto">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon data-icon="inline-start" />
                Tambah Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form action={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Tambah Supplier</DialogTitle>
                  <DialogDescription>
                    Masukkan nama dan deskripsi supplier baru.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nama Supplier</Label>
                    <Input id="name" name="name" placeholder="Contoh: PT Sumber Sehat" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contactPerson">PIC</Label>
                    <Input id="contactPerson" name="contactPerson" placeholder="Nama PIC supplier" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telepon</Label>
                    <Input id="phone" name="phone" placeholder="08xx / +62..." />
                  </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="leadTimeDays">Lead Time (hari)</Label>
                    <Input id="leadTimeDays" name="leadTimeDays" type="number" min={0} defaultValue={1} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="isActive">Status</Label>
                    <input type="hidden" name="isActive" value={newSupplierStatus} />
                    <Select value={newSupplierStatus} onValueChange={setNewSupplierStatus}>
                      <SelectTrigger id="isActive">
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Aktif</SelectItem>
                        <SelectItem value="false">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Deskripsi singkat..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <SubmitButton label="Simpan Supplier" />
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Supplier</TableHead>
                <TableHead>PIC / Kontak</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {searchValue ? "Supplier tidak ditemukan." : "Belum ada supplier."}
                  </TableCell>
                </TableRow>
              ) : (
                initialData.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-mono text-xs">{supplier.code}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{supplier.name}</span>
                        <span className="text-xs text-muted-foreground">{supplier.description || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{supplier.contactPerson || "-"}</span>
                        <span className="text-xs text-muted-foreground">{supplier.phone || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{supplier.leadTimeDays} hari</TableCell>
                    <TableCell>
                      <Badge variant={supplier.isActive ? "success" : "secondary"}>
                        {supplier.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontalIcon className="size-4" />
                            <span className="sr-only">Buka menu aksi untuk {supplier.name}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSupplier(supplier)
                              setIsEditOpen(true)
                            }}
                          >
                            <PencilIcon className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(supplier.id)}
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
        <DialogContent>
          <form action={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
              <DialogDescription>
                Perbarui informasi supplier.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nama Supplier</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={selectedSupplier?.name}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contactPerson">PIC</Label>
                <Input
                  id="edit-contactPerson"
                  name="contactPerson"
                  defaultValue={selectedSupplier?.contactPerson || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Telepon</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  defaultValue={selectedSupplier?.phone || ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-leadTimeDays">Lead Time (hari)</Label>
                  <Input
                    id="edit-leadTimeDays"
                    name="leadTimeDays"
                    type="number"
                    min={0}
                    defaultValue={selectedSupplier?.leadTimeDays ?? 1}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-isActive">Status</Label>
                  <select
                    id="edit-isActive"
                    name="isActive"
                    defaultValue={selectedSupplier?.isActive ? "true" : "false"}
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Deskripsi</Label>
                <Input
                  id="edit-description"
                  name="description"
                  defaultValue={selectedSupplier?.description || ""}
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
