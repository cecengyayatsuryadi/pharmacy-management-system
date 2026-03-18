"use client"

import * as React from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { 
  PlusIcon, 
  LayersIcon, 
  SearchIcon,
  ScaleIcon
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
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
import { Badge } from "@workspace/ui/components/badge"
import { toast } from "@workspace/ui/components/sonner"
import { createUnitAction } from "@/lib/actions/unit"
import type { Unit } from "@workspace/database"

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Mohon tunggu..." : label}
    </Button>
  )
}

export function UnitClient({ initialUnits }: { initialUnits: Unit[] }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  
  const [state, formAction] = useActionState(createUnitAction, null)

  React.useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
      setIsOpen(false)
    } else if (state?.message) {
      toast.error(state.message)
    }
  }, [state])

  const filteredUnits = initialUnits.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.abbreviation.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Master Satuan</h2>
        <p className="text-muted-foreground">
          Kelola satuan produk (UOM) dan konversi kemasan obat.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* LEFT: UNITS LIST */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Daftar Satuan</CardTitle>
              <CardDescription>Master data satuan yang tersedia.</CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusIcon className="mr-2 size-4" />
                  Satuan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Tambah Satuan Baru</DialogTitle>
                  <DialogDescription>
                    Masukkan nama satuan dan singkatannya.
                  </DialogDescription>
                </DialogHeader>
                <form action={formAction} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nama Satuan</Label>
                    <Input id="name" name="name" placeholder="Misal: Tablet, Box, Strip" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="abbreviation">Singkatan</Label>
                    <Input id="abbreviation" name="abbreviation" placeholder="Misal: tbl, bx, strp" required />
                  </div>
                  <DialogFooter>
                    <SubmitButton label="Simpan Satuan" />
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari satuan..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Singkatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                        Belum ada data.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUnits.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{unit.abbreviation}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: CONVERSION INFO (COMING SOON / PREVIEW) */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <ScaleIcon className="size-6" />
            </div>
            <h3 className="font-semibold text-lg">Konversi Satuan</h3>
            <p className="text-sm text-muted-foreground max-w-[250px] mt-2">
              Fitur mapping konversi antar satuan (misal: 1 Box = 10 Strip) akan tersedia di menu Master Produk.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
