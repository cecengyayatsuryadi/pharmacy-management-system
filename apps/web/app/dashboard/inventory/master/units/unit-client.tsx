"use client"

import * as React from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { 
  PlusIcon, 
  SearchIcon,
  ScaleIcon,
  ArrowRightIcon,
  LinkIcon
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { toast } from "@workspace/ui/components/sonner"
import { createUnitAction } from "@/lib/actions/unit"
import { createConversionAction } from "@/lib/actions/conversion"
import type { Unit } from "@workspace/database"

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Mohon tunggu..." : label}
    </Button>
  )
}

export function UnitClient({ 
  initialUnits,
  medicines,
  conversions
}: { 
  initialUnits: Unit[];
  medicines: any[];
  conversions: any[];
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [conversionSearch, setConversionSearch] = React.useState("")
  
  const [unitState, formActionUnit] = useActionState(createUnitAction, null)
  const [convState, formActionConv] = useActionState(createConversionAction, null)

  const [selectedMedId, setSelectedMedId] = React.useState<string>("")
  const [previewFactor, setPreviewFactor] = React.useState<number | "">(1)
  const [fromUnitId, setFromUnitId] = React.useState<string>("")
  const [toUnitId, setToUnitId] = React.useState<string>("")

  React.useEffect(() => {
    if (unitState?.success) {
      toast.success(unitState.message)
      setIsOpen(false)
    } else if (unitState?.message) {
      toast.error(unitState.message)
    }
  }, [unitState])

  React.useEffect(() => {
    if (convState?.success) {
      toast.success(convState.message)
      // Reset form locally could be done, but rely on page refresh
    } else if (convState?.message) {
      toast.error(convState.message)
    }
  }, [convState])

  const filteredUnits = initialUnits.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.abbreviation.toLowerCase().includes(search.toLowerCase())
  )

  const filteredConversions = conversions.filter((c: any) => 
    c.medicine?.name?.toLowerCase().includes(conversionSearch.toLowerCase())
  )

  // Get visually selected units for preview
  const fromUnitObj = initialUnits.find(u => u.id === fromUnitId)
  const toUnitObj = initialUnits.find(u => u.id === toUnitId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Satuan & Konversi</h2>
        <p className="text-muted-foreground">
          Kelola satuan produk (UOM) dan konversi kemasan obat (misal: 1 Box = 10 Strip).
        </p>
      </div>

      <Tabs defaultValue="units" className="space-y-4">
        <TabsList>
          <TabsTrigger value="units">Master Satuan</TabsTrigger>
          <TabsTrigger value="conversions">Konversi Satuan</TabsTrigger>
        </TabsList>

        <TabsContent value="units">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Daftar Satuan</CardTitle>
                <CardDescription>Master data satuan dasar yang tersedia.</CardDescription>
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
                  <form action={formActionUnit} className="grid gap-4 py-4">
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
                <div className="relative max-w-sm">
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
                      <TableHead>Nama Satuan</TableHead>
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
        </TabsContent>

        <TabsContent value="conversions">
          <div className="grid gap-6 md:grid-cols-3">
            {/* LEFT: FORM */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Tambah Konversi</CardTitle>
                <CardDescription>Definisikan relasi antar satuan untuk produk tertentu.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={formActionConv} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="medicineId">Produk / Obat</Label>
                    <Select name="medicineId" value={selectedMedId} onValueChange={setSelectedMedId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih obat..." />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines.map((med: any) => (
                          <SelectItem key={med.id} value={med.id}>
                            {med.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <Label>Satuan Besar (Dari)</Label>
                    <Select name="fromUnitId" value={fromUnitId} onValueChange={setFromUnitId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih satuan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {initialUnits.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <Label>Nilai Konversi (=)</Label>
                      <Input 
                        name="factor" 
                        type="number" 
                        min="0.01" 
                        step="0.01" 
                        value={previewFactor}
                        onChange={(e) => setPreviewFactor(parseFloat(e.target.value))}
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Satuan Kecil (Ke)</Label>
                    <Select name="toUnitId" value={toUnitId} onValueChange={setToUnitId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih satuan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {initialUnits.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {fromUnitObj && toUnitObj && previewFactor && (
                    <div className="p-3 bg-muted rounded-md border mt-4 text-center">
                      <p className="text-sm font-medium">Preview Kalkulasi</p>
                      <div className="flex items-center justify-center gap-2 mt-2 text-primary">
                        <Badge variant="outline" className="text-sm">1 {fromUnitObj.name}</Badge>
                        <span className="font-bold">=</span>
                        <Badge className="text-sm">{previewFactor} {toUnitObj.name}</Badge>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <SubmitButton label="Simpan Konversi" />
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* RIGHT: LIST */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Daftar Konversi</CardTitle>
                <CardDescription>Semua aturan konversi satuan per produk.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative max-w-sm">
                    <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Cari produk..."
                      className="pl-9"
                      value={conversionSearch}
                      onChange={(e) => setConversionSearch(e.target.value)}
                    />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Satuan Besar</TableHead>
                        <TableHead className="text-center">Konversi</TableHead>
                        <TableHead>Satuan Kecil</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredConversions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            Belum ada data konversi.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredConversions.map((conv: any) => (
                          <TableRow key={conv.id}>
                            <TableCell className="font-medium">{conv.medicine?.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">1 {conv.fromUnit?.name}</Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                                <LinkIcon className="size-3" />
                                <span className="font-bold text-foreground">x {Number(conv.factor)}</span>
                                <ArrowRightIcon className="size-3" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge>{conv.toUnit?.name}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
