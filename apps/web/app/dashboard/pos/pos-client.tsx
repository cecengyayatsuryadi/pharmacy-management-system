"use client"

import * as React from "react"
import { Medicine } from "@workspace/database"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@workspace/ui/components/table"
import { 
  PlusIcon, 
  MinusIcon, 
  Trash2Icon, 
  ShoppingCartIcon, 
  SearchIcon,
  CheckCircle2Icon,
  PrinterIcon
} from "lucide-react"
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@workspace/ui/components/resizable"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import { toast } from "sonner"
import { createSaleAction } from "@/lib/actions/sale"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

interface CartItem {
  medicineId: string
  name: string
  quantity: number
  price: number
  sku: string | null
  stock: number
}

export function POSClient({ medicines, organization }: { medicines: Medicine[], organization: any }) {
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [search, setSearch] = React.useState("")
  const [paymentMethod, setPaymentMethod] = React.useState("cash")
  const [paidAmount, setPaidAmount] = React.useState(0)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [lastSale, setLastSale] = React.useState<any>(null)
  const [showReceipt, setShowReceipt] = React.useState(false)

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    (m.sku && m.sku.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 10)

  const addToCart = (medicine: Medicine) => {
    const existing = cart.find(c => c.medicineId === medicine.id)
    const stock = parseFloat(medicine.stock)

    if (stock <= 0) {
      toast.error("Stok habis")
      return
    }

    if (existing) {
      if (existing.quantity + 1 > stock) {
        toast.error("Stok tidak cukup")
        return
      }
      setCart(cart.map(c => 
        c.medicineId === medicine.id 
          ? { ...c, quantity: c.quantity + 1 } 
          : c
      ))
    } else {
      setCart([...cart, {
        medicineId: medicine.id,
        name: medicine.name,
        quantity: 1,
        price: parseFloat(medicine.price),
        sku: medicine.sku,
        stock: stock
      }])
    }
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.medicineId === id) {
        const newQty = c.quantity + delta
        if (newQty > c.stock) {
          toast.error("Stok tidak cukup")
          return c
        }
        if (newQty < 1) return c
        return { ...c, quantity: newQty }
      }
      return c
    }))
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.medicineId !== id))
  }

  const subtotal = cart.reduce((acc, item) => acc + (item.quantity * item.price), 0)
  const change = paidAmount - subtotal

  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (paidAmount < subtotal) {
      toast.error("Pembayaran kurang")
      return
    }

    setIsProcessing(true)
    const res = await createSaleAction({
      items: cart.map(c => ({
        medicineId: c.medicineId,
        quantity: c.quantity,
        priceAtSale: c.price
      })),
      paymentMethod,
      paidAmount,
    })

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Penjualan berhasil")
      setLastSale(res.data)
      setShowReceipt(true)
      setCart([])
      setPaidAmount(0)
    }
    setIsProcessing(false)
  }

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <ResizablePanelGroup orientation="horizontal" className="rounded-lg border">
        {/* Left Side: Product Search */}
        <ResizablePanel defaultSize={60}>
          <div className="flex h-full flex-col p-4">
            <div className="relative mb-4">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama obat atau SKU..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (filteredMedicines.length === 1 && filteredMedicines[0]) {
                      addToCart(filteredMedicines[0])
                      setSearch("")
                    } else if (filteredMedicines.length > 1) {
                      // Jika hasil > 1 tapi ada yang SKU-nya cocok persis (misal scan barcode)
                      const exactMatch = filteredMedicines.find(
                        (m) => m.sku?.toLowerCase() === search.toLowerCase()
                      )
                      if (exactMatch) {
                        addToCart(exactMatch)
                        setSearch("")
                      }
                    }
                  }
                }}
                autoFocus
              />
            </div>
            
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                {filteredMedicines.map((m) => (
                  <Card 
                    key={m.id} 
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => addToCart(m)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-bold line-clamp-1">{m.name}</CardTitle>
                        <Badge variant={parseFloat(m.stock) <= 0 ? "destructive" : "secondary"}>
                          {m.stock} {m.unit}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-muted-foreground mb-1">{m.sku || "-"}</p>
                      <p className="font-bold text-primary">{formatIDR(parseFloat(m.price))}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Side: Cart and Checkout */}
        <ResizablePanel defaultSize={40}>
          <div className="flex h-full flex-col p-4 bg-muted/20">
            <div className="flex items-center gap-2 mb-4 font-bold">
              <ShoppingCartIcon className="size-5" />
              Keranjang Belanja
              <Badge className="ml-auto">{cart.length}</Badge>
            </div>

            <ScrollArea className="flex-1 -mx-2 px-2 mb-4 border-b">
              {cart.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-muted-foreground italic">
                  Keranjang masih kosong
                </div>
              ) : (
                <div className="flex flex-col gap-3 pb-4">
                  {cart.map((item) => (
                    <div key={item.medicineId} className="flex flex-col gap-1 p-2 rounded-md bg-background border">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium line-clamp-1">{item.name}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-6 text-destructive"
                          onClick={() => removeFromCart(item.medicineId)}
                        >
                          <Trash2Icon className="size-3" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="size-6"
                            onClick={() => updateQuantity(item.medicineId, -1)}
                          >
                            <MinusIcon className="size-3" />
                          </Button>
                          <span className="text-sm w-6 text-center">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="size-6"
                            onClick={() => updateQuantity(item.medicineId, 1)}
                          >
                            <PlusIcon className="size-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-bold">{formatIDR(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Total and Checkout */}
            <div className="flex flex-col gap-4 mt-auto">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatIDR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatIDR(subtotal)}</span>
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <Label className="text-xs">Metode</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Metode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Tunai</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="qris">QRIS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Bayar (Rp)</Label>
                    <Input 
                      type="number" 
                      value={paidAmount} 
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center px-1 text-sm">
                  <span className="text-muted-foreground">Kembalian:</span>
                  <span className={`font-bold ${change < 0 ? 'text-destructive' : 'text-primary'}`}>
                    {formatIDR(change)}
                  </span>
                </div>

                <Button 
                  className="w-full" 
                  size="lg" 
                  disabled={cart.length === 0 || change < 0 || isProcessing}
                  onClick={handleCheckout}
                >
                  {isProcessing ? "Memproses..." : "Selesaikan Penjualan"}
                </Button>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2Icon className="size-5 text-primary" />
              Penjualan Berhasil
            </DialogTitle>
            <DialogDescription>
              Transaksi {lastSale?.invoiceNumber} telah selesai diproses.
            </DialogDescription>
          </DialogHeader>
          
          <div id="receipt-content" className="flex flex-col gap-4 py-4 border-y border-dashed">
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * {
                  visibility: hidden;
                }
                #receipt-content, #receipt-content * {
                  visibility: visible;
                }
                #receipt-content {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 58mm; /* Standard thermal paper width */
                  padding: 2mm;
                  font-family: monospace;
                  font-size: 10px;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}} />
            
            <div className="text-center pb-2">
              <h3 className="font-bold text-lg leading-tight uppercase">{organization?.name || "APOTEK"}</h3>
              {organization?.address && (
                <p className="text-[9px] text-muted-foreground mt-1 whitespace-pre-wrap">{organization.address}</p>
              )}
              {organization?.phone && (
                <p className="text-[9px] text-muted-foreground mt-0.5">Telp: {organization.phone}</p>
              )}
              <div className="border-b border-dashed my-2"></div>
              <p className="text-xs text-muted-foreground mt-1">{lastSale?.invoiceNumber}</p>
              <p className="text-[10px] text-muted-foreground">
                {lastSale?.createdAt ? new Date(lastSale.createdAt).toLocaleString("id-ID") : "-"}
              </p>
            </div>

            <div className="flex flex-col gap-1 border-t border-dashed pt-2 mt-2">
              {lastSale?.items?.map((item: any, i: number) => (
                <div key={i} className="flex flex-col text-xs">
                  <span className="font-medium">{item.medicine?.name}</span>
                  <div className="flex justify-between">
                    <span>{item.quantity} x {formatIDR(Number(item.priceAtSale))}</span>
                    <span>{formatIDR(Number(item.totalPrice))}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 border-t pt-2 mt-2">
              <div className="flex justify-between text-sm font-bold">
                <span>Total</span>
                <span>{formatIDR(Number(lastSale?.totalAmount || 0))}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Bayar</span>
                <span>{formatIDR(Number(lastSale?.paidAmount || 0))}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Kembali</span>
                <span>{formatIDR(Number(lastSale?.changeAmount || 0))}</span>
              </div>
            </div>

            <div className="text-center text-[8px] mt-4 border-t pt-2">
              <p>Terima Kasih Atas Kunjungan Anda</p>
              <p>Semoga Cepat Sembuh</p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowReceipt(false)}>
              Tutup
            </Button>
            <Button onClick={() => window.print()}>
              <PrinterIcon className="size-4 mr-2" />
              Cetak Struk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
