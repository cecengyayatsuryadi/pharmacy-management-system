"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import { 
  PlusIcon, 
  SearchIcon,
  ScaleIcon,
  ArrowRightIcon,
  LinkIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
  BoxIcon,
  Link2Icon
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { toast } from "@workspace/ui/components/sonner"
import { createUnitAction, updateUnitAction, deleteUnitAction } from "@/lib/actions/unit"
import { createConversionAction, updateConversionAction, deleteConversionAction } from "@/lib/actions/conversion"
import { getMedicines } from "@/lib/actions/medicine"
import type { Unit, Medicine, UnitConversion } from "@workspace/database"
import { useSearchParams, useRouter } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"

type ConversionWithRelations = UnitConversion & {
  medicine: Medicine;
  fromUnit: Unit;
  toUnit: Unit;
}

interface Metadata {
  total: number
  page: number
  limit: number
  totalPages: number
}

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
  unitMetadata,
  medicines,
  initialConversions,
  convMetadata
}: { 
  initialUnits: Unit[];
  unitMetadata: Metadata;
  medicines: Medicine[];
  initialConversions: ConversionWithRelations[];
  convMetadata: Metadata;
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState(searchParams.get("tab") || "units")

  // Unit State
  const [isUnitSheetOpen, setIsUnitSheetOpen] = React.useState(false)
  const [unitMode, setUnitMode] = React.useState<"create" | "edit">("create")
  const [selectedUnit, setSelectedUnit] = React.useState<Unit | null>(null)
  const [unitSearch, setUnitSearch] = React.useState(searchParams.get("unitSearch") || "")

  // Conversion State
  const [isConvSheetOpen, setIsConvSheetOpen] = React.useState(false)
  const [convMode, setConvMode] = React.useState<"create" | "edit">("create")
  const [selectedConv, setSelectedConv] = React.useState<ConversionWithRelations | null>(null)
  const [convSearch, setConvSearch] = React.useState(searchParams.get("convSearch") || "")
  
  // Conversion Form State
  const [selectedMedId, setSelectedMedId] = React.useState<string>("")
  const [previewFactor, setPreviewFactor] = React.useState<number | "">(1)
  const [fromUnitId, setFromUnitId] = React.useState<string>("")
  const [toUnitId, setToUnitId] = React.useState<string>("")

  // Combobox specific state
  const [openCombobox, setOpenCombobox] = React.useState(false)
  const [medQuery, setMedQuery] = React.useState("")
  const [asyncMedicines, setAsyncMedicines] = React.useState<Medicine[]>(medicines || [])
  const [isLoadingMeds, setIsLoadingMeds] = React.useState(false)

  // URL Handling
  const debouncedUnitSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set("unitSearch", value)
    else params.delete("unitSearch")
    params.set("unitPage", "1")
    router.push(`?${params.toString()}`, { scroll: false })
  }, 500)

  const debouncedConvSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set("convSearch", value)
    else params.delete("convSearch")
    params.set("convPage", "1")
    router.push(`?${params.toString()}`, { scroll: false })
  }, 500)

  const handlePageChange = (key: "unitPage" | "convPage", page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, page.toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // Medicine Fetching for Combobox
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (!openCombobox) return;
      setIsLoadingMeds(true)
      try {
        const { data } = await getMedicines(1, 15, medQuery)
        setAsyncMedicines(data)
      } catch (err) {
        setAsyncMedicines([])
      } finally {
        setIsLoadingMeds(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [medQuery, openCombobox])

  const selectedMed = asyncMedicines.find(m => m.id === selectedMedId) || medicines?.find(m => m.id === selectedMedId)

  // Unit Handlers
  const openCreateUnit = () => {
    setUnitMode("create")
    setSelectedUnit(null)
    setIsUnitSheetOpen(true)
  }

  const openEditUnit = (unit: Unit) => {
    setUnitMode("edit")
    setSelectedUnit(unit)
    setIsUnitSheetOpen(true)
  }

  async function handleUnitSubmit(formData: FormData) {
    let result
    if (unitMode === "create") {
      result = await createUnitAction(null, formData)
    } else if (selectedUnit) {
      result = await updateUnitAction(selectedUnit.id, null, formData)
    }

    if (result?.success) {
      toast.success(result.message)
      setIsUnitSheetOpen(false)
    } else {
      toast.error(result?.message || "Terjadi kesalahan")
    }
  }

  async function handleUnitDelete(id: string) {
    if (confirm("Apakah Anda yakin ingin menghapus satuan ini?")) {
      const result = await deleteUnitAction(id)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    }
  }

  // Conversion Handlers
  const openCreateConv = () => {
    setConvMode("create")
    setSelectedConv(null)
    setSelectedMedId("")
    setFromUnitId("")
    setToUnitId("")
    setPreviewFactor(1)
    setIsConvSheetOpen(true)
  }

  const openEditConv = (conv: ConversionWithRelations) => {
    setConvMode("edit")
    setSelectedConv(conv)
    setSelectedMedId(conv.medicineId)
    setFromUnitId(conv.fromUnitId)
    setToUnitId(conv.toUnitId)
    setPreviewFactor(Number(conv.factor))
    setIsConvSheetOpen(true)
  }

  async function handleConvSubmit(formData: FormData) {
    if (!formData.has("medicineId")) formData.append("medicineId", selectedMedId)
    if (!formData.has("fromUnitId")) formData.append("fromUnitId", fromUnitId)
    if (!formData.has("toUnitId")) formData.append("toUnitId", toUnitId)

    let result
    if (convMode === "create") {
      result = await createConversionAction(null, formData)
    } else if (selectedConv) {
      result = await updateConversionAction(selectedConv.id, null, formData)
    }

    if (result?.success) {
      toast.success(result.message)
      setIsConvSheetOpen(false)
    } else {
      toast.error(result?.message || "Terjadi kesalahan")
    }
  }

  async function handleConvDelete(id: string) {
    if (confirm("Apakah Anda yakin ingin menghapus konversi ini?")) {
      const result = await deleteConversionAction(id)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    }
  }

  const fromUnitObj = initialUnits.find(u => u.id === fromUnitId)
  const toUnitObj = initialUnits.find(u => u.id === toUnitId)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Satuan & Konversi</h2>
            <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
              {activeTab === "units" ? unitMetadata.total : convMetadata.total} Data
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Kelola satuan produk (UOM) dan aturan konversi kemasan obat.
          </p>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="units">Master Satuan</TabsTrigger>
          <TabsTrigger value="conversions">Konversi Satuan</TabsTrigger>
        </TabsList>

        <TabsContent value="units" className="m-0 outline-none space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau singkatan satuan..."
                className="pl-9 pr-10"
                value={unitSearch}
                onChange={(e) => {
                  setUnitSearch(e.target.value)
                  debouncedUnitSearch(e.target.value)
                }}
              />
              {unitSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
                  onClick={() => {
                    setUnitSearch("")
                    debouncedUnitSearch("")
                  }}
                >
                  <XIcon className="size-3" />
                </Button>
              )}
            </div>
            <Button onClick={openCreateUnit}>
              <PlusIcon className="mr-2 size-4" />
              Tambah Satuan
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="pl-6">Nama Satuan</TableHead>
                    <TableHead>Singkatan</TableHead>
                    <TableHead className="w-[80px] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialUnits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <BoxIcon className="size-8 opacity-20" />
                          <p className="text-sm">
                            {unitSearch ? "Tidak ada satuan yang sesuai dengan pencarian." : "Belum ada data satuan yang terdaftar."}
                          </p>
                          {unitSearch && (
                            <Button 
                              variant="link" 
                              onClick={() => { 
                                setUnitSearch("")

                              }}
                            >
                              Bersihkan Pencarian
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialUnits.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-2">
                            <BoxIcon className="size-3 text-muted-foreground/40 shrink-0" />
                            <span className="font-semibold text-sm tracking-tight">{unit.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono text-[10px] py-0 px-1.5 uppercase font-bold tracking-wider">
                            {unit.abbreviation}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontalIcon className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              <DropdownMenuLabel>Opsi Unit</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openEditUnit(unit)}>
                                <PencilIcon className="mr-2 size-4" />
                                Edit Satuan
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onClick={() => handleUnitDelete(unit.id)}
                              >
                                <TrashIcon className="mr-2 size-4" />
                                Hapus Satuan
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

          {unitMetadata.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (unitMetadata.page > 1) handlePageChange("unitPage", unitMetadata.page - 1)
                    }}
                  />
                </PaginationItem>
                {Array.from({ length: unitMetadata.totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={unitMetadata.page === i + 1}
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange("unitPage", i + 1)
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
                      if (unitMetadata.page < unitMetadata.totalPages)
                        handlePageChange("unitPage", unitMetadata.page + 1)
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>

        <TabsContent value="conversions" className="m-0 outline-none space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama obat atau produk..."
                className="pl-9 pr-10"
                value={convSearch}
                onChange={(e) => {
                  setConvSearch(e.target.value)
                  debouncedConvSearch(e.target.value)
                }}
              />
              {convSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
                  onClick={() => {
                    setConvSearch("")
                    debouncedConvSearch("")
                  }}
                >
                  <XIcon className="size-3" />
                </Button>
              )}
            </div>
            <Button onClick={openCreateConv}>
              <PlusIcon className="mr-2 size-4" />
              Tambah Konversi
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="pl-6">Produk / Obat</TableHead>
                    <TableHead>Satuan Besar</TableHead>
                    <TableHead className="text-center">Konversi</TableHead>
                    <TableHead>Satuan Kecil</TableHead>
                    <TableHead className="w-[80px] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialConversions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <Link2Icon className="size-8 opacity-20" />
                          <p className="text-sm">
                            {convSearch ? "Tidak ada konversi yang sesuai dengan pencarian." : "Belum ada data konversi yang terdaftar."}
                          </p>
                          {convSearch && (
                            <Button 
                              variant="link" 
                              onClick={() => { 
                                setConvSearch("")

                              }}
                            >
                              Bersihkan Pencarian
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialConversions.map((conv) => (
                      <TableRow key={conv.id}>
                        <TableCell className="pl-6">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <Link2Icon className="size-3 text-muted-foreground/30 shrink-0" />
                              <span className="font-semibold text-sm tracking-tight">{conv.medicine?.name}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono pl-5">
                              {conv.medicine?.code}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-bold text-[10px] px-1.5 py-0 text-muted-foreground border-muted-foreground/30">
                            1 {conv.fromUnit?.abbreviation}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                            <ScaleIcon className="size-3 text-muted-foreground/30 shrink-0" />
                            <div className="h-px w-2 bg-muted-foreground/30" />
                            <span className="font-black text-sm text-foreground tabular-nums">
                              {Number(conv.factor)}
                            </span>
                            <ArrowRightIcon className="size-3 text-primary" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-bold text-[10px] px-1.5 py-0 uppercase tracking-wider">
                            {conv.toUnit?.abbreviation}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontalIcon className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px]">
                              <DropdownMenuLabel>Opsi Konversi</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openEditConv(conv)}>
                                <PencilIcon className="mr-2 size-4" />
                                Edit Konversi
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onClick={() => handleConvDelete(conv.id)}
                              >
                                <TrashIcon className="mr-2 size-4" />
                                Hapus Konversi
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

          {convMetadata.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (convMetadata.page > 1) handlePageChange("convPage", convMetadata.page - 1)
                    }}
                  />
                </PaginationItem>
                {Array.from({ length: convMetadata.totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={convMetadata.page === i + 1}
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange("convPage", i + 1)
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
                      if (convMetadata.page < convMetadata.totalPages)
                        handlePageChange("convPage", convMetadata.page + 1)
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>
      </Tabs>

      {/* UNIT SHEET */}
      <Sheet open={isUnitSheetOpen} onOpenChange={setIsUnitSheetOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <form action={handleUnitSubmit} className="flex h-full flex-col">
            <SheetHeader className="shrink-0 border-b px-6 py-5 bg-muted/5">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                {unitMode === "create" ? (
                  <><PlusIcon className="size-5 text-primary" /> Tambah Satuan Baru</>
                ) : (
                  <><PencilIcon className="size-5 text-primary" /> Edit Satuan</>
                )}
              </SheetTitle>
              <SheetDescription>
                Masukkan nama satuan dan singkatannya untuk katalog produk.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-6">
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nama Satuan <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={selectedUnit?.name}
                      placeholder="Misal: Tablet, Box, Botol"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="abbreviation">
                      Singkatan <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="abbreviation"
                      name="abbreviation"
                      defaultValue={selectedUnit?.abbreviation}
                      placeholder="Misal: tbl, bx, btl"
                      required
                    />
                  </div>
                </div>
              </ScrollArea>
            </div>

            <SheetFooter className="mt-0 flex shrink-0 flex-row items-center justify-end gap-3 border-t px-6 py-4 bg-muted/5">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsUnitSheetOpen(false)}>
                Batal
              </Button>
              <div className="flex-1">
                <SubmitButton
                  label={unitMode === "create" ? "Tambah Satuan" : "Simpan Perubahan"}
                />
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* CONVERSION SHEET */}
      <Sheet open={isConvSheetOpen} onOpenChange={setIsConvSheetOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <form action={handleConvSubmit} className="flex h-full flex-col">
            <SheetHeader className="shrink-0 border-b px-6 py-5 bg-muted/5">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                {convMode === "create" ? (
                  <><PlusIcon className="size-5 text-primary" /> Tambah Konversi</>
                ) : (
                  <><PencilIcon className="size-5 text-primary" /> Edit Konversi</>
                )}
              </SheetTitle>
              <SheetDescription>
                Tentukan relasi rasio antar satuan untuk produk spesifik.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-6 pb-12">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pilih Produk</Label>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCombobox}
                          className="justify-between w-full font-medium h-10 px-3 bg-muted/20 border-dashed"
                          disabled={convMode === "edit"}
                        >
                          {selectedMed ? (
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="truncate">{selectedMed.name}</span>
                              <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0 font-mono">{selectedMed.code}</Badge>
                            </div>
                          ) : "Cari nama obat / produk..."}
                          <ChevronsUpDownIcon className="size-4 opacity-50 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="Ketik nama obat..." 
                            value={medQuery}
                            onValueChange={setMedQuery}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {isLoadingMeds ? "Mencari data..." : "Obat tidak ditemukan."}
                            </CommandEmpty>
                            <CommandGroup>
                              {asyncMedicines.map((med) => (
                                <CommandItem
                                  key={med.id}
                                  value={med.id}
                                  onSelect={(currentValue) => {
                                    setSelectedMedId(currentValue === selectedMedId ? "" : currentValue)
                                    setOpenCombobox(false)
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-semibold">{med.name}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">{med.code}</span>
                                  </div>
                                  <CheckIcon
                                    className={`ml-auto size-4 ${selectedMedId === med.id ? "opacity-100" : "opacity-0"}`}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Aturan Konversi</Label>
                    
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="fromUnitId">Satuan Besar (Induk)</Label>
                        <Select value={fromUnitId} onValueChange={setFromUnitId}>
                          <SelectTrigger className="h-10 bg-muted/10">
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

                      <div className="flex items-center gap-4 py-2">
                        <div className="h-px flex-1 bg-border" />
                        <div className="size-8 rounded-full border flex items-center justify-center bg-muted/50 shadow-inner">
                          <ScaleIcon className="size-4 text-muted-foreground" />
                        </div>
                        <div className="h-px flex-1 bg-border" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="factor">Isi / Rasio (=)</Label>
                          <Input 
                            id="factor"
                            name="factor" 
                            type="number" 
                            min="0.01" 
                            step="0.01" 
                            className="h-10 font-bold text-center text-primary"
                            value={previewFactor}
                            onChange={(e) => setPreviewFactor(parseFloat(e.target.value) || "")}
                            required 
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="toUnitId">Satuan Kecil (Anak)</Label>
                          <Select value={toUnitId} onValueChange={setToUnitId}>
                            <SelectTrigger className="h-10 bg-muted/10">
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
                      </div>
                    </div>
                  </div>

                  {fromUnitObj && toUnitObj && previewFactor && (
                    <div className="mt-8 overflow-hidden rounded-xl border bg-emerald-500/5 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                      <div className="bg-emerald-500/10 px-4 py-2 border-b dark:border-emerald-500/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Preview Logika</p>
                      </div>
                      <div className="flex flex-col items-center justify-center p-6 gap-3">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-tighter">1 Satuan Induk</span>
                            <Badge variant="outline" className="text-sm h-8 px-4 font-black border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                              {fromUnitObj.abbreviation}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-col items-center pt-5">
                            <div className="flex items-center gap-1.5">
                              <div className="h-0.5 w-6 bg-emerald-500/30" />
                              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">x{previewFactor}</span>
                              <ArrowRightIcon className="size-4 text-emerald-500" />
                            </div>
                          </div>

                          <div className="flex flex-col items-center">
                            <span className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-tighter">Satuan Anak</span>
                            <Badge className="text-sm h-8 px-4 font-black bg-emerald-600 dark:bg-emerald-500">
                              {toUnitObj.abbreviation}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground mt-4 italic leading-tight">
                          Sistem akan menghitung stok otomatis: 1 {fromUnitObj.name} berisi {previewFactor} {toUnitObj.name}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <SheetFooter className="mt-0 flex shrink-0 flex-row items-center justify-end gap-3 border-t px-6 py-4 bg-muted/5">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsConvSheetOpen(false)}>
                Batal
              </Button>
              <div className="flex-1">
                <SubmitButton
                  label={convMode === "create" ? "Simpan Konversi" : "Simpan Perubahan"}
                />
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
