"use client"

import * as React from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { 
  CalendarIcon, 
  DownloadIcon, 
  TrendingUpIcon, 
  WalletIcon, 
  PercentIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon
} from "lucide-react"
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Line, 
  LineChart,
  ResponsiveContainer,
  Tooltip
} from "recharts"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@workspace/ui/components/table"
import { 
  ChartConfig, 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@workspace/ui/components/chart"
import { Calendar } from "@workspace/ui/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { getSalesReportAction } from "@/lib/actions/report"
import { toast } from "sonner"

interface ReportTransaction {
  id: string
  invoiceNumber: string
  createdAt: Date | string
  paymentMethod: string
  totalAmount: string
  user: {
    name: string | null
  } | null
}

interface ReportData {
  summary: {
    totalRevenue: number
    totalCogs: number
    grossProfit: number
    margin: number
  }
  trend: Array<{ date: string; revenue: number }>
  topProducts: Array<{ name: string; quantity: number; revenue: number; profit: number }>
  transactions: ReportTransaction[]
}

interface ReportClientProps {
  initialData: ReportData
  initialFilter: { startDate: Date, endDate: Date }
  plan: string
}

export function ReportClient({ initialData, initialFilter, plan }: ReportClientProps) {
  const [data, setData] = React.useState(initialData)
  const [loading, setLoading] = React.useState(false)
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: initialFilter.startDate,
    to: initialFilter.endDate,
  })
  const [showProModal, setShowProModal] = React.useState(false)

  const handleFetchReport = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error("Pilih rentang tanggal terlebih dahulu")
      return
    }

    setLoading(true)
    try {
      const result = await getSalesReportAction({
        startDate: dateRange.from,
        endDate: dateRange.to
      })
      setData(result)
    } catch (error) {
      toast.error("Gagal memuat laporan")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val)
  }

  const handleExport = () => {
    if (plan === "gratis") {
      setShowProModal(true)
    } else {
      toast.success("Mengekspor laporan... (Fitur ini akan segera hadir)")
    }
  }

  const chartConfig = {
    revenue: {
      label: "Omzet",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header & Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Laporan Penjualan</h2>
          <p className="text-muted-foreground">Analisis performa keuangan apotek Anda.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal w-[280px]",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon data-icon="inline-start" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd LLL yyyy")} -{" "}
                      {format(dateRange.to, "dd LLL yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd LLL yyyy")
                  )
                ) : (
                  <span>Pilih tanggal</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange as any}
                onSelect={setDateRange as any}
                numberOfMonths={2}
              />
              <div className="p-3 border-t">
                <Button className="w-full" size="sm" onClick={handleFetchReport} disabled={loading}>
                  Terapkan Filter
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={handleExport}>
            <DownloadIcon data-icon="inline-start" />
            Ekspor
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Omzet</CardTitle>
            <WalletIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Penjualan kotor</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Modal</CardTitle>
            <ArrowUpRightIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalCogs)}</div>
            <p className="text-xs text-muted-foreground">Harga pokok penjualan (COGS)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Laba Kotor</CardTitle>
            <TrendingUpIcon className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(data.summary.grossProfit)}</div>
            <p className="text-xs text-muted-foreground">Selisih omzet dan modal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Margin</CardTitle>
            <PercentIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.margin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Persentase keuntungan</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Tren Penjualan Harian</CardTitle>
            <CardDescription>Visualisasi pendapatan dalam periode terpilih</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pl-2">
            {data.trend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Tidak ada data transaksi pada periode ini
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                <LineChart data={data.trend} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(str) => format(new Date(str), "dd MMM")}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(val) => `Rp${val/1000}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--color-revenue)" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Produk Paling Menguntungkan</CardTitle>
            <CardDescription>Berdasarkan total laba bersih</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {data.topProducts.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Belum ada data produk
              </div>
            ) : (
              <ChartContainer 
                config={{
                  profit: { label: "Laba", color: "hsl(var(--primary))" }
                }} 
                className="h-full w-full aspect-auto"
              >
                <BarChart 
                  data={data.topProducts} 
                  layout="vertical"
                  margin={{ left: 30, right: 20 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    hide 
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    fontSize={10}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="profit" fill="var(--color-profit)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaksi Terakhir</CardTitle>
          <CardDescription>50 transaksi terbaru dalam periode ini</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kasir</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Belum ada transaksi
                  </TableCell>
                </TableRow>
              ) : (
                data.transactions.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-xs text-primary">{sale.invoiceNumber}</TableCell>
                    <TableCell className="text-xs">{format(new Date(sale.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}</TableCell>
                    <TableCell className="text-xs">{sale.user?.name || "-"}</TableCell>
                    <TableCell className="text-xs capitalize">{sale.paymentMethod}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(parseFloat(sale.totalAmount))}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pro Modal */}
      <Dialog open={showProModal} onOpenChange={setShowProModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2Icon className="text-primary size-5" />
              Fitur Paket Pro
            </DialogTitle>
            <DialogDescription className="pt-2">
              Fitur **Ekspor Laporan (PDF/Excel)** dan **Analisis Detail** hanya tersedia untuk pengguna paket Pro.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-lg space-y-3 my-2 text-sm">
            <div className="flex items-center gap-2 font-medium">Keuntungan Pro:</div>
            <ul className="grid grid-cols-1 gap-2">
              <li className="flex items-center gap-2">
                <CheckCircle2Icon className="size-3 text-emerald-600" />
                Ekspor data tanpa batas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2Icon className="size-3 text-emerald-600" />
                Staf kasir tidak terbatas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2Icon className="size-3 text-emerald-600" />
                Input obat hingga ribuan item
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProModal(false)}>Nanti Saja</Button>
            <Button className="bg-primary text-primary-foreground">Hubungi Sales / Upgrade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
