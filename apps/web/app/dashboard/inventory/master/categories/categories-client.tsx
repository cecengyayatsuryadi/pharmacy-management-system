"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  SearchIcon, 
  XIcon,
  MoreHorizontalIcon,
  LayersIcon,
  TagIcon,
  PaletteIcon,
  ChevronRightIcon
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Badge } from "@workspace/ui/components/badge"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/lib/actions/category"
import {
  createMedicineGroupAction,
  updateMedicineGroupAction,
  deleteMedicineGroupAction,
} from "@/lib/actions/medicine-group"
import { useSearchParams, useRouter } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"

interface Metadata {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface CategoriesClientProps {
  initialCategories: { data: any[], metadata: Metadata }
  initialGroups: { data: any[], metadata: Metadata }
  activeTab: string
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Mohon tunggu..." : label}
    </Button>
  )
}

export function CategoriesClient({ initialCategories, initialGroups, activeTab }: CategoriesClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Search State
  const [catSearch, setCatSearch] = React.useState(searchParams.get("catSearch") || "")
  const [groupSearch, setGroupSearch] = React.useState(searchParams.get("groupSearch") || "")
  
  // State for Sheet (Form)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"create" | "edit">("create")
  const [targetType, setTargetType] = React.useState<"category" | "group">("category")
  const [selectedItem, setSelectedItem] = React.useState<any>(null)

  // State for Alert Dialog (Delete)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<any>(null)

  // URL Handling
  const debouncedCatSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set("catSearch", value)
    else params.delete("catSearch")
    params.set("catPage", "1")
    router.push(`?${params.toString()}`, { scroll: false })
  }, 500)

  const debouncedGroupSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set("groupSearch", value)
    else params.delete("groupSearch")
    params.set("groupPage", "1")
    router.push(`?${params.toString()}`, { scroll: false })
  }, 500)

  const handlePageChange = (key: "catPage" | "groupPage", page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, page.toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const openCreate = (type: "category" | "group") => {
    setMode("create")
    setTargetType(type)
    setSelectedItem(null)
    setIsSheetOpen(true)
  }

  const openEdit = (type: "category" | "group", item: any) => {
    setMode("edit")
    setTargetType(type)
    setSelectedItem(item)
    setIsSheetOpen(true)
  }

  const openDelete = (type: "category" | "group", item: any) => {
    setTargetType(type)
    setItemToDelete(item)
    setIsDeleteOpen(true)
  }

  async function handleSubmit(formData: FormData) {
    let result
    if (targetType === "category") {
      if (mode === "create") {
        result = await createCategoryAction(null, formData)
      } else {
        result = await updateCategoryAction(selectedItem.id, null, formData)
      }
    } else {
      if (mode === "create") {
        result = await createMedicineGroupAction(null, formData)
      } else {
        result = await updateMedicineGroupAction(selectedItem.id, null, formData)
      }
    }

    if (result?.success) {
      toast.success(result.message)
      setIsSheetOpen(false)
    } else {
      toast.error(result?.message || "Terjadi kesalahan")
    }
  }

  async function confirmDelete() {
    let result
    if (targetType === "category") {
      result = await deleteCategoryAction(itemToDelete.id)
    } else {
      result = await deleteMedicineGroupAction(itemToDelete.id)
    }

    if (result?.success) {
      toast.success(result.message)
      setIsDeleteOpen(false)
    } else {
      toast.error(result?.message || "Terjadi kesalahan")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Kategori & Golongan</h2>
            <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
              {activeTab === "categories" ? initialCategories.metadata.total : initialGroups.metadata.total} Data
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Kelola klasifikasi dan regulasi obat untuk pengaturan katalog.
          </p>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="categories">Kategori Obat</TabsTrigger>
          <TabsTrigger value="groups">Golongan Obat</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="m-0 outline-none space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama kategori..."
                className="pl-9 pr-10"
                value={catSearch}
                onChange={(e) => {
                  setCatSearch(e.target.value)
                  debouncedCatSearch(e.target.value)
                }}
              />
              {catSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
                  onClick={() => {
                    setCatSearch("")
                    debouncedCatSearch("")
                  }}
                >
                  <XIcon className="size-3" />
                </Button>
              )}
            </div>
            <Button onClick={() => openCreate("category")}>
              <PlusIcon className="mr-2 size-4" />
              Tambah Kategori
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="pl-6">Nama Kategori</TableHead>
                    <TableHead>Indikator</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-center">Jumlah Produk</TableHead>
                    <TableHead className="w-[80px] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialCategories.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <TagIcon className="size-8 opacity-20" />
                          <p className="text-sm">
                            {catSearch ? "Tidak ada kategori yang sesuai dengan pencarian." : "Belum ada data kategori yang terdaftar."}
                          </p>
                          {catSearch && (
                            <Button 
                              variant="link" 
                              onClick={() => { 
                                setCatSearch("")

                              }}
                            >
                              Bersihkan Pencarian
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialCategories.data.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-2">
                            <TagIcon className="size-3 text-muted-foreground/40 shrink-0" />
                            <span className="font-semibold text-sm tracking-tight">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className="h-5 px-1.5 text-[9px] uppercase font-bold border-muted-foreground/30 rounded-[4px]"
                              style={{ 
                                borderColor: item.color, 
                                color: item.color,
                                backgroundColor: `${item.color}10`
                              }}
                            >
                              {item.color}
                            </Badge>
                            <div 
                              className="size-3 rounded-[4px] border shadow-sm" 
                              style={{ backgroundColor: item.color }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                          {item.description || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="h-5 px-2 text-[9px] font-bold tabular-nums">
                            {item.medicinesCount} <span className="ml-1 font-normal opacity-70">Obat</span>
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
                              <DropdownMenuLabel>Opsi Data</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openEdit("category", item)}>
                                <PencilIcon className="mr-2 size-4" /> Edit Kategori
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onClick={() => openDelete("category", item)}
                              >
                                <TrashIcon className="mr-2 size-4" /> Hapus Kategori
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

          {initialCategories.metadata.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (initialCategories.metadata.page > 1) handlePageChange("catPage", initialCategories.metadata.page - 1)
                    }}
                  />
                </PaginationItem>
                {Array.from({ length: initialCategories.metadata.totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={initialCategories.metadata.page === i + 1}
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange("catPage", i + 1)
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
                      if (initialCategories.metadata.page < initialCategories.metadata.totalPages)
                        handlePageChange("catPage", initialCategories.metadata.page + 1)
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>

        <TabsContent value="groups" className="m-0 outline-none space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama golongan..."
                className="pl-9 pr-10"
                value={groupSearch}
                onChange={(e) => {
                  setGroupSearch(e.target.value)
                  debouncedGroupSearch(e.target.value)
                }}
              />
              {groupSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
                  onClick={() => {
                    setGroupSearch("")
                    debouncedGroupSearch("")
                  }}
                >
                  <XIcon className="size-3" />
                </Button>
              )}
            </div>
            <Button onClick={() => openCreate("group")}>
              <PlusIcon className="mr-2 size-4" />
              Tambah Golongan
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="pl-6">Nama Golongan</TableHead>
                    <TableHead>Indikator</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-center">Jumlah Produk</TableHead>
                    <TableHead className="w-[80px] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialGroups.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <LayersIcon className="size-8 opacity-20" />
                          <p className="text-sm">
                            {groupSearch ? "Tidak ada golongan yang sesuai dengan pencarian." : "Belum ada data golongan yang terdaftar."}
                          </p>
                          {groupSearch && (
                            <Button 
                              variant="link" 
                              onClick={() => { 
                                setGroupSearch("")

                              }}
                            >
                              Bersihkan Pencarian
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialGroups.data.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-2">
                            <LayersIcon className="size-3 text-muted-foreground/40 shrink-0" />
                            <span className="font-semibold text-sm tracking-tight">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className="h-5 px-1.5 text-[9px] uppercase font-bold border-muted-foreground/30 rounded-full"
                              style={{ 
                                borderColor: item.color, 
                                color: item.color,
                                backgroundColor: `${item.color}10`
                              }}
                            >
                              {item.color}
                            </Badge>
                            <div 
                              className="size-3 rounded-full border shadow-sm" 
                              style={{ backgroundColor: item.color }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate text-xs text-muted-foreground">
                          {item.description || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="h-5 px-2 text-[9px] font-bold tabular-nums">
                            {item.medicinesCount} <span className="ml-1 font-normal opacity-70">Obat</span>
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
                              <DropdownMenuLabel>Opsi Data</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openEdit("group", item)}>
                                <PencilIcon className="mr-2 size-4" /> Edit Golongan
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onClick={() => openDelete("group", item)}
                              >
                                <TrashIcon className="mr-2 size-4" /> Hapus Golongan
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

          {initialGroups.metadata.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (initialGroups.metadata.page > 1) handlePageChange("groupPage", initialGroups.metadata.page - 1)
                    }}
                  />
                </PaginationItem>
                {Array.from({ length: initialGroups.metadata.totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={initialGroups.metadata.page === i + 1}
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange("groupPage", i + 1)
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
                      if (initialGroups.metadata.page < initialGroups.metadata.totalPages)
                        handlePageChange("groupPage", initialGroups.metadata.page + 1)
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>
      </Tabs>

      {/* Form Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <form action={handleSubmit} className="flex h-full flex-col">
            <SheetHeader className="shrink-0 border-b px-6 py-5 bg-muted/5">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                {mode === "create" ? (
                  <><PlusIcon className="size-5 text-primary" /> Tambah {targetType === "category" ? "Kategori" : "Golongan"}</>
                ) : (
                  <><PencilIcon className="size-5 text-primary" /> Edit {targetType === "category" ? "Kategori" : "Golongan"}</>
                )}
              </SheetTitle>
              <SheetDescription>
                Lengkapi detail informasi di bawah ini untuk pengaturan katalog.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-6">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nama {targetType === "category" ? "Kategori" : "Golongan"}</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={selectedItem?.name}
                      placeholder={targetType === "category" ? "Contoh: Antibiotik" : "Contoh: Obat Keras"}
                      required
                    />
                  </div>
                  {targetType === "group" && (
                    <div className="grid gap-3 rounded-xl border bg-muted/20 p-4">
                      <div className="flex items-center gap-2">
                        <PaletteIcon className="size-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider">Identifikasi Visual</span>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="color">Warna Golongan</Label>
                        <div className="flex gap-2">
                          <Input
                            id="color"
                            name="color"
                            type="color"
                            defaultValue={selectedItem?.color || "#3b82f6"}
                            className="h-10 w-12 p-1"
                          />
                          <Input
                            placeholder="#000000"
                            defaultValue={selectedItem?.color || "#3b82f6"}
                            onChange={(e) => {
                              const colorInput = document.getElementById("color") as HTMLInputElement
                              if (colorInput) colorInput.value = e.target.value
                            }}
                            className="flex-1 font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground italic leading-tight">
                          Warna ini akan digunakan pada badge otomatis di seluruh sistem untuk menandai golongan obat.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="color">
                      Warna Indikator <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="color"
                        name="color"
                        type="color"
                        className="size-10 p-1"
                        defaultValue={selectedItem?.color || "#3b82f6"}
                      />
                      <Input
                        id="color-text"
                        placeholder="#000000"
                        className="flex-1 font-mono text-xs uppercase"
                        value={selectedItem?.color || "#3b82f6"}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={selectedItem?.description}
                      placeholder="Penjelasan singkat mengenai klasifikasi ini..."
                      className="min-h-[120px] resize-none"
                    />
                  </div>
                </div>
              </ScrollArea>
            </div>

            <SheetFooter className="mt-0 flex shrink-0 flex-row items-center justify-end gap-3 border-t px-6 py-4 bg-muted/5">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsSheetOpen(false)}>
                Batal
              </Button>
              <div className="flex-1">
                <SubmitButton label={mode === "create" ? `Simpan ${targetType === "category" ? 'Kategori' : 'Golongan'}` : "Simpan Perubahan"} />
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <TrashIcon className="size-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Hapus {targetType === "category" ? "Kategori" : "Golongan"}?</DialogTitle>
            <DialogDescription className="text-center">
              Anda akan menghapus data <strong>{itemToDelete?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            {itemToDelete?.medicinesCount > 0 ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-destructive">
                <div className="flex items-center gap-2 mb-1">
                  <XIcon className="size-4 font-bold" />
                  <p className="text-sm font-bold uppercase tracking-tight">Tindakan Dibatasi</p>
                </div>
                <p className="text-xs leading-relaxed">
                  Masih ada <strong>{itemToDelete?.medicinesCount} produk</strong> yang terhubung ke data ini. 
                  Sistem mencegah penghapusan untuk menjaga integritas riwayat stok. 
                  Mohon pindahkan produk tersebut ke {targetType === "category" ? 'kategori' : 'golongan'} lain terlebih dahulu.
                </p>
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Tindakan ini permanen dan tidak dapat dibatalkan.
              </p>
            )}
          </div>

          <DialogFooter className="sm:justify-center gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
            {itemToDelete?.medicinesCount === 0 && (
              <Button variant="destructive" className="flex-1" onClick={confirmDelete}>Hapus Sekarang</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
