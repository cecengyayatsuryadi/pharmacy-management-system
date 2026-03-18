"use client"

import * as React from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { 
  PlusIcon, 
  Building2Icon, 
  MapPinIcon, 
  SearchIcon,
  PencilIcon,
  MoreVerticalIcon,
  CheckCircle2Icon,
  XCircleIcon
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Badge } from "@workspace/ui/components/badge"
import { toast } from "@workspace/ui/components/sonner"
import { createWarehouseAction, updateWarehouseAction } from "@/lib/actions/warehouse"
import type { Warehouse } from "@workspace/database"

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Mohon tunggu..." : label}
    </Button>
  )
}

export function WarehouseClient({ initialWarehouses }: { initialWarehouses: Warehouse[] }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [editingWarehouse, setEditingWarehouse] = React.useState<Warehouse | null>(null)
  
  const [state, formAction] = useActionState(
    editingWarehouse 
      ? updateWarehouseAction.bind(null, editingWarehouse.id) 
      : createWarehouseAction, 
    null
  )

  React.useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
      setIsOpen(false)
      setEditingWarehouse(null)
    } else if (state?.message) {
      toast.error(state.message)
    }
  }, [state])

  const filteredWarehouses = initialWarehouses.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) || 
    w.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setIsOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Master Gudang</h2>
        <p className="text-muted-foreground">
          Kelola lokasi gudang dan penyimpanan stok apotek Anda.
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau kode gudang..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Dialog open={isOpen} onOpenChange={(val) => {
          setIsOpen(val)
          if (!val) setEditingWarehouse(null)
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingWarehouse(null)}>
              <PlusIcon className="mr-2 size-4" />
              Tambah Gudang
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingWarehouse ? "Edit Gudang" : "Tambah Gudang Baru"}</DialogTitle>
              <DialogDescription>
                Masukkan rincian informasi gudang untuk manajemen stok.
              </DialogDescription>
            </DialogHeader>
            <form action={formAction} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Kode Gudang</Label>
                <Input 
                  id="code" 
                  name="code" 
                  placeholder="MISAL: GUD-01" 
                  defaultValue={editingWarehouse?.code}
                  required 
                />
                {state?.errors?.code && <p className="text-xs text-destructive">{state.errors.code[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Gudang</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="Misal: Gudang Utama" 
                  defaultValue={editingWarehouse?.name}
                  required 
                />
                {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Alamat / Lokasi</Label>
                <Textarea 
                  id="address" 
                  name="address" 
                  placeholder="Alamat lengkap gudang" 
                  defaultValue={editingWarehouse?.address ?? ""}
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  name="isActive" 
                  value="true" 
                  defaultChecked={editingWarehouse?.isActive ?? true}
                  className="size-4 rounded border-gray-300 text-primary focus:ring-primary" 
                />
                <Label htmlFor="isActive">Gudang Aktif</Label>
              </div>
              <DialogFooter>
                <SubmitButton label={editingWarehouse ? "Simpan Perubahan" : "Buat Gudang"} />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredWarehouses.length === 0 ? (
          <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
            {search ? "Gudang tidak ditemukan." : "Belum ada data gudang."}
          </div>
        ) : (
          filteredWarehouses.map((warehouse) => (
            <Card key={warehouse.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{warehouse.name}</h3>
                      <p className="text-xs font-mono text-muted-foreground">{warehouse.code}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreVerticalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(warehouse)}>
                        <PencilIcon className="mr-2 size-4" />
                        Edit Informasi
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPinIcon className="size-3.5" />
                    <span className="truncate">{warehouse.address || "Tidak ada alamat"}</span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    {warehouse.isActive ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                        <CheckCircle2Icon className="mr-1 size-3" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-destructive">
                        <XCircleIcon className="mr-1 size-3" />
                        Non-aktif
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
