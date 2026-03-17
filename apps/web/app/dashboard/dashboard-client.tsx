"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart"
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Pie, 
  PieChart, 
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts"
import { Badge } from "@workspace/ui/components/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { AlertCircleIcon, PackageIcon, TrendingUpIcon, WalletIcon, ActivityIcon, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface DashboardClientProps {
  stats: {
    todayRevenue: number
    todayTransactions: number
    totalStockValue: number
    categoryDistribution: { name: string, count: number }[]
    criticalStockCount: number
    criticalItems: { id: string, name: string, stock: string, minStock: string }[]
    expiringCount: number
    expiringItems: { id: string, name: string, stock: string, expiryDate: Date | null }[]
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export function DashboardClient({ stats }: DashboardClientProps) {
  const chartConfig = {
    count: {
      label: "Jumlah Obat",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Penjualan Hari Ini</CardTitle>
            <TrendingUpIcon className="size-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(stats.todayRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total omzet hari ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
            <ActivityIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayTransactions}</div>
            <p className="text-xs text-muted-foreground">Nota / Faktur dicetak</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Stok Kritis</CardTitle>
            <AlertCircleIcon className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.criticalStockCount}</div>
            <p className="text-xs text-muted-foreground">Obat mencapai batas minimum</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Hampir Kedaluwarsa</CardTitle>
            <CalendarIcon className="size-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.expiringCount}</div>
            <p className="text-xs text-muted-foreground">Akan expired dlm 6 bulan</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Stok Kritis Table */}
        <Card className="flex flex-col">
          <CardHeader className="px-4 py-1">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-base leading-tight">Stok Kritis (Beli Lagi)</CardTitle>
              <Badge variant="destructive" className="dark:!bg-destructive dark:!text-destructive-foreground">Prioritas</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Obat</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.criticalItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-sm text-muted-foreground">
                      Semua stok aman
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.criticalItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-sm">{item.name}</TableCell>
                      <TableCell className="text-right font-bold text-destructive text-sm">{item.stock}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">{item.minStock}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Expiring Items Table */}
        <Card className="flex flex-col">
          <CardHeader className="px-4 py-1">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-base leading-tight">Hampir Kedaluwarsa (Cek Fisik)</CardTitle>
              <Badge variant="warning">Perhatian</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Obat</TableHead>
                  <TableHead>Sisa Stok</TableHead>
                  <TableHead className="text-right">Tanggal ED</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.expiringItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-sm text-muted-foreground">
                      Tidak ada peringatan expired
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.expiringItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-sm">{item.name}</TableCell>
                      <TableCell className="text-sm">{item.stock}</TableCell>
                      <TableCell className="text-right text-warning font-medium text-sm">
                        {item.expiryDate ? format(new Date(item.expiryDate), "dd MMM yyyy", { locale: id }) : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Category Chart - Full Width at Bottom */}
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Kategori Obat</CardTitle>
          <CardDescription>Jumlah jenis obat pada setiap kategori di persediaan</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
            <BarChart data={stats.categoryDistribution} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
