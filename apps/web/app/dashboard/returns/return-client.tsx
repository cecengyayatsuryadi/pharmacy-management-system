"use client"

import React, { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Textarea } from "@workspace/ui/components/textarea"
import { Search, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils/number"
import { getSaleForReturnAction, createReturnAction, type ReturnInput } from "@/lib/actions/return"

export function ReturnClient() {
  const [invoiceQuery, setInvoiceQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [sale, setSale] = useState<any>(null)

  // State for current return inputs
  // Record<saleItemId, { quantityReturned: number, refundAmount: number }>
  const [returnMap, setReturnMap] = useState<Record<string, { qty: number, refund: number }>>({})
  const [reason, setReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoiceQuery) return
    setIsSearching(true)
    const res = await getSaleForReturnAction(invoiceQuery)
    if (res.error) {
      toast.error(res.error)
      setSale(null)
    } else {
      setSale(res.data)
      // Initialize return map
      const initialMap: Record<string, { qty: number, refund: number }> = {}
      res.data.items.forEach((i: any) => {
        initialMap[i.id] = { qty: 0, refund: 0 }
      })
      setReturnMap(initialMap)
      setReason("")
    }
    setIsSearching(false)
  }

  const handleQtyChange = (itemId: string, maxQty: number, value: string, priceAtSale: string) => {
    let qty = parseFloat(value) || 0
    if (qty < 0) qty = 0
    if (qty > maxQty) qty = maxQty

    setReturnMap(prev => ({
      ...prev,
      [itemId]: {
        qty,
        refund: qty * parseFloat(priceAtSale)
      }
    }))
  }

  const handleSubmitReturn = async () => {
    if (!sale) return
    if (!reason.trim()) return toast.error("Alasan retur wajib diisi")

    const itemsToReturn = Object.entries(returnMap)
      .filter(([_, v]) => v.qty > 0)
      .map(([saleItemId, v]) => {
        const saleItem = sale.items.find((i: any) => i.id === saleItemId)
        return {
          saleItemId,
          medicineId: saleItem.medicineId,
          quantityReturned: v.qty,
          refundAmount: v.refund
        }
      })

    if (itemsToReturn.length === 0) {
      return toast.error("Tidak ada item yang dipilih untuk diretur")
    }

    const payload: ReturnInput = {
      saleId: sale.id,
      reason,
      items: itemsToReturn,
    }

    setIsProcessing(true)
    const res = await createReturnAction(payload)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Retur berhasil diproses")
      setSale(null)
      setInvoiceQuery("")
    }
    setIsProcessing(false)
  }

  const totalRefund = Object.values(returnMap).reduce((sum, v) => sum + v.refund, 0)
  const isAnyItemReturned = totalRefund > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Retur Penjualan</h1>
        <p className="text-muted-foreground">Proses pengembalian obat dari pelanggan dan kembalikan stok.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cari Transaksi</CardTitle>
          <CardDescription>Masukkan nomor struk / invoice (misal: INV-20231025-0001)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <Input
              placeholder="Nomor Invoice"
              value={invoiceQuery}
              onChange={e => setInvoiceQuery(e.target.value)}
              required
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      {sale && (
        <Card>
          <CardHeader>
            <CardTitle>Detail Transaksi & Proses Retur</CardTitle>
            <CardDescription>Pelanggan: {sale.customerName || "-"} | Tgl: {new Date(sale.createdAt).toLocaleString("id-ID")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Obat</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Qty Dibeli</TableHead>
                  <TableHead>Sudah Retur</TableHead>
                  <TableHead className="w-[150px]">Retur Sekarang</TableHead>
                  <TableHead className="text-right">Nominal Refund</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.map((item: any) => {
                  const currentRet = returnMap[item.id]?.qty || 0
                  const currentRefund = returnMap[item.id]?.refund || 0
                  const isFullyReturned = item.returnable <= 0

                  return (
                    <TableRow key={item.id} className={isFullyReturned ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{item.medicine.name}</TableCell>
                      <TableCell>{formatCurrency(parseFloat(item.priceAtSale))}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-destructive">{item.alreadyReturned}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={item.returnable}
                          step="any"
                          disabled={isFullyReturned}
                          value={currentRet || ""}
                          onChange={(e) => handleQtyChange(item.id, item.returnable, e.target.value, item.priceAtSale)}
                        />
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(currentRefund)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {isAnyItemReturned && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center bg-muted/20 p-4 rounded-md">
                  <span className="font-bold">Total Refund:</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(totalRefund)}</span>
                </div>

                <div className="space-y-2">
                  <Label>Alasan Retur *</Label>
                  <Textarea
                    placeholder="Contoh: Salah beli obat, obat rusak, dll..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSubmitReturn} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                    Konfirmasi Retur & Kembalikan Stok
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
