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
  HistoryIcon
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
import type { Warehouse } from "@workspace/database"

interface StockItem {
  id: string
  quantity: string
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
      return <Badge variant="destructive" className="text-[10px] h-5">Expired</Badge>
    }
    if (isWithinInterval(expiryDate, { start: new Date(), end: addDays(new Date(), 90) })) {
      return <Badge variant="outline" className="text-orange-500 border-orange-500 text-[10px] h-5">Hampir Expired</Badge>
    }
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Stok Real-time</h2>
        <p className="text-muted-foreground">
          Pantau saldo stok obat berdasarkan gudang dan nomor batch.
        </p>
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
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
              onClick={() => {
                setSearchValue("")
                const params = new URLSearchParams(searchParams.toString())
                params.delete("search")
                router.push(`?${params.toString()}`)
              }}
            >
              <XIcon className="size-3" />
            </Button>
          )}
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Obat</TableHead>
                <TableHead>Lokasi Gudang</TableHead>
                <TableHead>Batch & Kadaluarsa</TableHead>
                <TableHead className="text-right">Saldo Stok</TableHead>
                <TableHead>Update Terakhir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Belum ada saldo stok tercatat.
                  </TableCell>
                </TableRow>
              ) : (
                initialData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.medicine.name}</span>
                        <span className="text-[10px] text-muted-foreground">SKU: {item.medicine.sku || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {item.warehouse.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {item.batch ? (
                          <>
                            <span className="text-xs font-mono font-medium">{item.batch.batchNumber}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(item.batch.expiryDate), "dd MMM yyyy")}
                              </span>
                              {getExpiryStatus(item.batch.expiryDate)}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Tanpa Batch</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-primary">{item.quantity}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{item.medicine.unit}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <HistoryIcon className="size-3" />
                        {format(new Date(item.updatedAt), "dd/MM/yy HH:mm")}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
