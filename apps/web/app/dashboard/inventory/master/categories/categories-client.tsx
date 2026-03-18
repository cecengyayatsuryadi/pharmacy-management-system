"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  SearchIcon, 
  XIcon,
  MoreHorizontalIcon
} from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

interface CategoriesClientProps {
  initialCategories: any
  initialGroups: any
  activeTab: string
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Mohon tunggu..." : label}
    </Button>
  )
}

export function CategoriesClient({ initialCategories, initialGroups, activeTab }: CategoriesClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchValue, setSearchValue] = React.useState(searchParams.get("search") || "")
  
  // State for Sheet (Form)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"create" | "edit">("create")
  const [targetType, setTargetType] = React.useState<"category" | "group">("category")
  const [selectedItem, setSelectedItem] = React.useState<any>(null)

  // State for Alert Dialog (Delete)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<any>(null)

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

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    params.set("page", "1")
    params.delete("search") // Clear search when switching tabs
    setSearchValue("")
    router.push(`?${params.toString()}`)
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Cari ${activeTab === "categories" ? "kategori" : "golongan"}...`}
            className="pl-8"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value)
              debouncedSearch(e.target.value)
            }}
          />
        </div>
        <Button onClick={() => openCreate(activeTab === "categories" ? "category" : "group")}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Tambah {activeTab === "categories" ? "Kategori" : "Golongan"}
        </Button>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="categories">Kategori Obat</TabsTrigger>
          <TabsTrigger value="groups">Golongan Obat</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Kategori</CardTitle>
              <CardDescription>
                Kelompokkan obat berdasarkan fungsinya (misal: Antibiotik, Vitamin).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-center">Jumlah Produk</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialCategories.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Tidak ada kategori ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialCategories.data.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {item.description || "-"}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          <Badge variant="secondary">{item.medicinesCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit("category", item)}>
                                <PencilIcon className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => openDelete("category", item)}
                              >
                                <TrashIcon className="mr-2 h-4 w-4" /> Hapus
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

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Golongan</CardTitle>
              <CardDescription>
                Klasifikasi obat sesuai regulasi (misal: Obat Keras, Bebas).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Golongan</TableHead>
                    <TableHead>Warna Badge</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-center">Jumlah Produk</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialGroups.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Tidak ada golongan ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialGroups.data.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-4 w-4 rounded-full border" 
                              style={{ backgroundColor: item.color }}
                            />
                            <code className="text-xs">{item.color}</code>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate">
                          {item.description || "-"}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          <Badge variant="secondary">{item.medicinesCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit("group", item)}>
                                <PencilIcon className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => openDelete("group", item)}
                              >
                                <TrashIcon className="mr-2 h-4 w-4" /> Hapus
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
      </Tabs>

      {/* Form Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-[425px]">
          <form action={handleSubmit}>
            <SheetHeader>
              <SheetTitle>
                {mode === "create" ? "Tambah" : "Edit"}{" "}
                {targetType === "category" ? "Kategori" : "Golongan"}
              </SheetTitle>
              <SheetDescription>
                Lengkapi detail informasi di bawah ini.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
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
                <div className="grid gap-2">
                  <Label htmlFor="color">Warna Identifikasi</Label>
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
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Warna ini akan digunakan sebagai penanda visual golongan obat.
                  </p>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={selectedItem?.description}
                  placeholder="Penjelasan singkat..."
                  rows={4}
                />
              </div>
            </div>
            <SheetFooter>
              <SubmitButton label={mode === "create" ? "Simpan" : "Perbarui"} />
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus {targetType === "category" ? "Kategori" : "Golongan"}?</DialogTitle>
            <DialogDescription>
              Anda akan menghapus <strong>{itemToDelete?.name}</strong>. 
              {itemToDelete?.medicinesCount > 0 ? (
                <div className="mt-2 rounded-md bg-destructive/10 p-3 text-destructive">
                  <p className="font-semibold">Tindakan Dilarang:</p>
                  <p>Masih ada <strong>{itemToDelete?.medicinesCount} produk</strong> yang menggunakan ini. Ubah kategori/golongan produk tersebut terlebih dahulu.</p>
                </div>
              ) : (
                <p className="mt-2">Tindakan ini tidak dapat dibatalkan.</p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
            {itemToDelete?.medicinesCount === 0 && (
              <Button variant="destructive" onClick={confirmDelete}>Hapus</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
