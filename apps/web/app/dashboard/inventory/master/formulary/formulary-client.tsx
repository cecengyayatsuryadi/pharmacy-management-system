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
  BookOpenIcon,
  RefreshCwIcon,
  PillIcon,
  InfoIcon,
  FingerprintIcon,
  TagIcon,
  LayersIcon,
  ArrowLeftRightIcon
} from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"

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
  upsertFormularyAction,
  deleteFormularyAction,
  createSubstitutionAction,
  deleteSubstitutionAction,
} from "@/lib/actions/formulary"
import type { MedicineFormulary, MedicineSubstitution, Medicine, MedicineGroup } from "@workspace/database"
import { useSearchParams, useRouter } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { ScrollArea } from "@workspace/ui/components/scroll-area"

type MedicineWithGroup = Medicine & { group: MedicineGroup | null }

interface FormularyClientProps {
  initialFormularies: (MedicineFormulary & { medicine: MedicineWithGroup })[]
  initialSubstitutions: (MedicineSubstitution & { medicine: MedicineWithGroup, substituteMedicine: MedicineWithGroup })[]
  medicines: Medicine[]
  formularyMetadata: { total: number; page: number; limit: number }
  substitutionMetadata: { total: number; page: number; limit: number }
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Mohon tunggu..." : label}
    </Button>
  )
}

export function FormularyClient({ 
  initialFormularies, 
  initialSubstitutions, 
  medicines, 
  formularyMetadata, 
  substitutionMetadata 
}: FormularyClientProps) {
  const getFormularyColor = (type: string) => {
    const t = type.toUpperCase()
    if (t === "FORNAS") return { color: "#3b82f6", label: "Fornas" } // Blue
    if (t === "BPJS") return { color: "#10b981", label: "BPJS" }   // Emerald
    if (t === "RS") return { color: "#8b5cf6", label: "Internal RS" } // Violet
    return { color: "#6b7280", label: type } // Gray default
  }

  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "formulary"
  const currentPage = Number(searchParams.get("page")) || 1
  const [searchValue, setSearchValue] = React.useState(searchParams.get("search") || "")

  const [isFormularySheetOpen, setIsFormularySheetOpen] = React.useState(false)
  const [isSubstitutionSheetOpen, setIsSubstitutionSheetOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"create" | "edit">("create")
  const [selectedFormulary, setSelectedFormulary] = React.useState<any>(null)

  const debouncedSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set("search", value)
    else params.delete("search")
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }, 500)

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams()
    params.set("tab", value)
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") params.set(key, value)
    else params.delete(key)
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`?${params.toString()}`)
  }

  const handleUpsertFormulary = async (formData: FormData) => {
    const result = await upsertFormularyAction(formData)
    if (result.message) {
      toast.success(result.message)
      setIsFormularySheetOpen(false)
    } else {
      toast.error(result.error || "Terjadi kesalahan")
    }
  }

  const handleDeleteFormulary = async (id: string) => {
    if (confirm("Hapus data formularium ini?")) {
      const result = await deleteFormularyAction(id)
      if (result.message) toast.success(result.message)
      else toast.error(result.error)
    }
  }

  const handleCreateSubstitution = async (formData: FormData) => {
    const result = await createSubstitutionAction(formData)
    if (result.message) {
      toast.success(result.message)
      setIsSubstitutionSheetOpen(false)
    } else {
      toast.error(result.error || "Terjadi kesalahan")
    }
  }

  const handleDeleteSubstitution = async (id: string) => {
    if (confirm("Hapus data substitusi ini?")) {
      const result = await deleteSubstitutionAction(id)
      if (result.message) toast.success(result.message)
      else toast.error(result.error)
    }
  }

  const openCreateFormulary = () => {
    setMode("create")
    setSelectedFormulary(null)
    setIsFormularySheetOpen(true)
  }

  const openEditFormulary = (f: any) => {
    setMode("edit")
    setSelectedFormulary(f)
    setIsFormularySheetOpen(true)
  }

  const totalPages = activeTab === "formulary" 
    ? Math.ceil(formularyMetadata.total / formularyMetadata.limit)
    : Math.ceil(substitutionMetadata.total / substitutionMetadata.limit)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Formularium & Substitusi</h2>
          <p className="text-muted-foreground">
            Kelola daftar obat formularium dan relasi obat pengganti (substitusi).
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="formulary">
            Daftar Formularium
          </TabsTrigger>
          <TabsTrigger value="substitution">
            Obat Substitusi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="formulary" className="m-0 outline-none space-y-4">
          {/* Formulary Search & Filter + Action */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama obat..."
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
                  onClick={() => {
                    setSearchValue("")
                    debouncedSearch("")
                  }}
                >
                  <XIcon className="size-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select
                defaultValue={searchParams.get("type") || "all"}
                onValueChange={(v) => handleFilterChange("type", v)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipe Formularium" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="Fornas">Fornas</SelectItem>
                  <SelectItem value="RS">Internal RS/Apotek</SelectItem>
                  <SelectItem value="BPJS">BPJS</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={openCreateFormulary} className="shrink-0">
                <PlusIcon className="mr-2 size-4" />
                Tambah Formularium
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nama Obat</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="w-[100px] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialFormularies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        {searchValue ? "Tidak ada formularium yang sesuai pencarian." : "Tidak ada data formularium."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialFormularies.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <PillIcon className="size-3 text-muted-foreground/40 shrink-0" />
                              <span className="font-semibold text-sm tracking-tight">{f.medicine.name}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground italic pl-5">
                              {f.medicine.genericName || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <Badge 
                              variant="outline" 
                              className="w-fit text-[9px] py-0 px-1.5 uppercase font-bold rounded-[4px] gap-1"
                              style={{ 
                                borderColor: `${getFormularyColor(f.type).color}40`, 
                                color: getFormularyColor(f.type).color,
                                backgroundColor: `${getFormularyColor(f.type).color}10`
                              }}
                            >
                              <TagIcon className="size-2.5 opacity-70" />
                              {f.type}
                            </Badge>
                            {f.medicine.group && (
                              <Badge 
                                variant="outline" 
                                className="w-fit text-[8px] py-0 px-1.5 uppercase font-bold rounded-full gap-1"
                                style={{ 
                                  borderColor: `${f.medicine.group.color}40`, 
                                  color: f.medicine.group.color,
                                  backgroundColor: `${f.medicine.group.color}10`
                                }}
                              >
                                <LayersIcon className="size-2.5 opacity-70" />
                                {f.medicine.group.name}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={f.status ? "success" : "secondary"} className="h-5 text-[10px]">
                            {f.status ? "Aktif" : "Non-aktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-[11px] leading-relaxed text-muted-foreground">
                          {f.note || "-"}
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
                              <DropdownMenuItem onClick={() => openEditFormulary(f)}>
                                <PencilIcon className="mr-2 size-4" />
                                Edit Data
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onClick={() => handleDeleteFormulary(f.id)}
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
        </TabsContent>

        <TabsContent value="substitution" className="m-0 outline-none space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama obat utama atau pengganti..."
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
                  onClick={() => {
                    setSearchValue("")
                    debouncedSearch("")
                  }}
                >
                  <XIcon className="size-3" />
                </Button>
              )}
            </div>
            <Button onClick={() => setIsSubstitutionSheetOpen(true)}>
              <PlusIcon className="mr-2 size-4" />
              Tambah Substitusi
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Obat Utama</TableHead>
                    <TableHead className="w-[60px] text-center"></TableHead>
                    <TableHead>Obat Pengganti (Substitusi)</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="w-[80px] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialSubstitutions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        {searchValue ? "Tidak ada substitusi yang sesuai pencarian." : "Belum ada relasi substitusi obat."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialSubstitutions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <PillIcon className="size-3 text-muted-foreground/40 shrink-0" />
                                <span className="font-semibold text-sm tracking-tight">{s.medicine.name}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground italic pl-5">
                                {s.medicine.genericName || "-"}
                              </span>
                            </div>
                            {s.medicine.group && (
                              <Badge 
                                variant="outline" 
                                className="w-fit text-[8px] py-0 px-1.5 uppercase font-bold rounded-full gap-1 ml-5"
                                style={{ 
                                  borderColor: `${s.medicine.group.color}40`, 
                                  color: s.medicine.group.color,
                                  backgroundColor: `${s.medicine.group.color}10`
                                }}
                              >
                                <LayersIcon className="size-2.5 opacity-70" />
                                {s.medicine.group.name}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center justify-center gap-1 opacity-40">
                            <RefreshCwIcon className="size-3" />
                            <span className="text-[8px] font-bold uppercase tracking-tighter">Ganti</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <PillIcon className="size-3 text-emerald-500/40 shrink-0" />
                                <span className="font-semibold text-sm tracking-tight text-emerald-600 dark:text-emerald-400">{s.substituteMedicine.name}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground italic pl-5">
                                {s.substituteMedicine.genericName || "-"}
                              </span>
                            </div>
                            {s.substituteMedicine.group && (
                              <Badge 
                                variant="outline" 
                                className="w-fit text-[8px] py-0 px-1.5 uppercase font-bold rounded-full gap-1 ml-5"
                                style={{ 
                                  borderColor: `${s.substituteMedicine.group.color}40`, 
                                  color: s.substituteMedicine.group.color,
                                  backgroundColor: `${s.substituteMedicine.group.color}10`
                                }}
                              >
                                <LayersIcon className="size-2.5 opacity-70" />
                                {s.substituteMedicine.group.name}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-[11px] leading-relaxed text-muted-foreground">
                          {s.note || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteSubstitution(s.id)}
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {totalPages > 1 && (
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
            {Array.from({ length: totalPages }).map((_, i) => (
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
                  if (currentPage < totalPages)
                    handlePageChange(currentPage + 1)
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Sheet Formularium */}
      <Sheet open={isFormularySheetOpen} onOpenChange={setIsFormularySheetOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <form action={handleUpsertFormulary} className="flex h-full flex-col">
            {selectedFormulary && <input type="hidden" name="id" value={selectedFormulary.id} />}
            <SheetHeader className="shrink-0 border-b px-6 py-4">
              <SheetTitle>{mode === "create" ? "Tambah Formularium" : "Edit Formularium"}</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Pilih Obat</Label>
                  <Select name="medicineId" defaultValue={selectedFormulary?.medicineId} disabled={mode === "edit"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cari obat..." />
                    </SelectTrigger>
                    <SelectContent>
                      {medicines.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Tipe Formularium</Label>
                  <Select name="type" defaultValue={selectedFormulary?.type || "Fornas"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fornas">Fornas</SelectItem>
                      <SelectItem value="RS">Internal RS/Apotek</SelectItem>
                      <SelectItem value="BPJS">BPJS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Keterangan</Label>
                  <Textarea name="note" defaultValue={selectedFormulary?.note || ""} placeholder="Contoh: Pembatasan maks 30 tab/bulan" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="status" id="status" defaultChecked={selectedFormulary?.status ?? true} value="true" />
                  <Label htmlFor="status">Status Aktif</Label>
                </div>
              </div>
            </ScrollArea>
            <SheetFooter className="border-t p-6">
              <SubmitButton label={mode === "create" ? "Simpan Data" : "Update Data"} />
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Sheet Substitusi */}
      <Sheet open={isSubstitutionSheetOpen} onOpenChange={setIsSubstitutionSheetOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <form action={handleCreateSubstitution} className="flex h-full flex-col">
            <SheetHeader className="shrink-0 border-b px-6 py-4">
              <SheetTitle>Tambah Obat Substitusi</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-md flex gap-2">
                  <InfoIcon className="size-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Substitusi adalah obat pengganti yang memiliki zat aktif atau khasiat yang sama. Digunakan saat stok utama kosong.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label>Obat Utama</Label>
                  <Select name="medicineId">
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih obat utama..." />
                    </SelectTrigger>
                    <SelectContent>
                      {medicines.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Obat Pengganti</Label>
                  <Select name="substituteMedicineId">
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih obat pengganti..." />
                    </SelectTrigger>
                    <SelectContent>
                      {medicines.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Catatan (Opsional)</Label>
                  <Textarea name="note" placeholder="Alasan substitusi..." />
                </div>
              </div>
            </ScrollArea>
            <SheetFooter className="border-t p-6">
              <SubmitButton label="Tambahkan Relasi" />
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
