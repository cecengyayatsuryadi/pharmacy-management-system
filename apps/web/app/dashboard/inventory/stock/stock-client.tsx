"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { 
  SearchIcon, 
  XIcon, 
  FilterIcon,
  Package2Icon,
  AlertCircleIcon,
  CalendarIcon,
  HistoryIcon,
  PlusIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  LockIcon,
  ShieldAlertIcon
} from "lucide-react"
import { format, isPast, isWithinInterval, addDays } from "date-fns"
import { id } from "date-fns/locale"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@workspace/ui/components/select"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import type { Warehouse } from "@workspace/database"

interface StockItem {
  id: string
  quantity: string
  reservedQuantity: string
  quarantineQuantity: string
  availableQuantity: string
  updatedAt: Date
  medicine: {
    id: string
    name: string
    sku: string | null
    unit: string
  }
  warehouse: {
    id: string
    name: string
  }
  batch: {
    id: string
    batchNumber: string
    expiryDate: Date
  } | null
}

interface StockClientProps {
  initialData: StockItem[]
  warehouses: Warehouse[]
  metadata: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function StockClient({ initialData, warehouses, metadata }: StockClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentPage = Number(searchParams.get("page")) || 1
  const [searchValue, setSearchValue] = React.useState(searchParams.get("search") || "")

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

  const handleWarehouseFilter = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (id && id !== "all") {
      params.set("warehouseId", id)
    } else {
      params.delete("warehouseId")
    }
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`?${params.toString()}`)
  }

  const getExpiryStatus = (date: Date | null) => {
    if (!date) return null
    const expiryDate = new Date(date)
    if (isPast(expiryDate)) {
      return <Badge variant="destructive">Expired</Badge>
    }
    if (isWithinInterval(expiryDate, { start: new Date(), end: addDays(new Date(), 90) })) {
      return <Badge variant="warning">Hampir Expired</Badge>
    }
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Stok Real-time</h2>
          <p className="text-muted-foreground text-sm">
            Pantau ketersediaan stok fisik vs stok layak jual (Available).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push("/dashboard/inventory/stock/in")}>
            <ArrowUpCircleIcon className="size-4 text-emerald-600" />
            <span className="hidden sm:inline">Stok Masuk</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push("/dashboard/inventory/stock/out")}>
            <ArrowDownCircleIcon className="size-4 text-red-600" />
            <span className="hidden sm:inline">Stok Keluar</span>
          </Button>
          <Button size="sm" className="gap-2" onClick={() => router.push("/dashboard/inventory/stock/adjustment")}>
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">Stok Opname</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
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
        </div>
        <Select
          defaultValue={searchParams.get("warehouseId") || "all"}
          onValueChange={handleWarehouseFilter}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <div className="flex items-center gap-2">
              <FilterIcon className="size-3.5" />
              <SelectValue placeholder="Semua Gudang" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Gudang</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TooltipProvider>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nama Obat</TableHead>
                  <TableHead>Lokasi / Batch</TableHead>
                  <TableHead className="text-right">Fisik</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">Quarantine</TableHead>
                  <TableHead className="text-right bg-primary/5 font-bold text-primary">Available</TableHead>
                  <TableHead>Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      Tidak ada data stok ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  initialData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{item.medicine.name}</span>
                          <span className="text-[10px] text-muted-foreground">{item.medicine.sku || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs">{item.warehouse.name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-muted-foreground">{item.batch?.batchNumber || "NO BATCH"}</span>
                            {getExpiryStatus(item.batch?.expiryDate || null)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger className="cursor-help underline decoration-dotted decoration-muted-foreground/30 font-mono text-xs text-amber-600">
                            {item.reservedQuantity}
                          </TooltipTrigger>
                          <TooltipContent>Stok sedang dipesan di antrean kasir</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger className="cursor-help underline decoration-dotted decoration-muted-foreground/30 font-mono text-xs text-red-600">
                            {item.quarantineQuantity}
                          </TooltipTrigger>
                          <TooltipContent>Stok rusak atau sedang dikarantina</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right bg-primary/5 font-bold text-primary font-mono">
                        {item.availableQuantity}
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {format(new Date(item.updatedAt), "dd/MM HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TooltipProvider>

      {metadata.totalPages > 1 && (
        <Pagination className="mt-4">
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
    </div>
  )
}
