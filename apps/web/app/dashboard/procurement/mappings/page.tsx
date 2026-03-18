import { getSupplierMedicines } from "@/lib/actions/supplier-medicine"
import { Input } from "@workspace/ui/components/input"
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
import { Badge } from "@workspace/ui/components/badge"
import { SearchIcon } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"

export default async function SupplierMedicineMappingsPage(props: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const limit = 10
  const search = searchParams.search?.trim() || ""
  const { data: rows, metadata } = await getSupplierMedicines(page, limit, search)

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    params.set("page", String(targetPage))
    return `?${params.toString()}`
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mapping Supplier Obat</h2>
        <p className="text-muted-foreground">
          Audit relasi supplier-obat untuk kebutuhan procurement intelligence.
        </p>
      </div>

      <div>
        <form className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={search}
            placeholder="Cari supplier, kode, obat, SKU..."
            aria-label="Cari mapping supplier obat"
            className="pl-9"
          />
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Obat</TableHead>
                <TableHead>SKU Supplier</TableHead>
                <TableHead>Harga Beli Terakhir</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {search
                      ? "Tidak ada mapping yang sesuai pencarian."
                      : "Belum ada mapping supplier-obat."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{row.supplier.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {row.supplier.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{row.medicine.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {row.medicine.sku || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.supplierSku || "-"}</TableCell>
                    <TableCell>
                      {row.lastPurchasePrice
                        ? `Rp ${Number(row.lastPurchasePrice).toLocaleString("id-ID")}`
                        : "-"}
                    </TableCell>
                    <TableCell>{row.leadTimeDays != null ? `${row.leadTimeDays} hari` : "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge variant={row.isActive ? "secondary" : "outline"}>
                          {row.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                        {row.isPrimary && <Badge>Primary</Badge>}
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
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={page > 1 ? buildHref(page - 1) : "#"}
                aria-disabled={page <= 1}
              />
            </PaginationItem>
            {Array.from({ length: metadata.totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink href={buildHref(i + 1)} isActive={page === i + 1}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href={page < metadata.totalPages ? buildHref(page + 1) : "#"}
                aria-disabled={page >= metadata.totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
