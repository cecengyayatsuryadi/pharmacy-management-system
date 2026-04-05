"use client"

import React, { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import { Trash2, Plus, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { createPrescriptionAction, type PrescriptionInput } from "@/lib/actions/prescription"

type Medicine = { id: string; name: string; price: string; stock: string }

export function PrescriptionClient({ medicines }: { medicines: Medicine[] }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [form, setForm] = useState({
    doctorName: "",
    patientName: "",
    patientAge: "",
    patientAddress: "",
    patientPhone: "",
    notes: "",
  })

  type PItem = {
    id: string
    isCompounded: boolean
    medicineId: string
    quantity: number
    instructions: string
    compoundedName: string
    compoundingFee: number
    components: { id: string, medicineId: string, quantityPerPackage: number }[]
  }

  const [items, setItems] = useState<PItem[]>([])

  const addItem = (isCompounded: boolean) => {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      isCompounded,
      medicineId: "",
      quantity: 1,
      instructions: "",
      compoundedName: "",
      compoundingFee: 0,
      components: isCompounded ? [{ id: crypto.randomUUID(), medicineId: "", quantityPerPackage: 1 }] : []
    }])
  }

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  const updateItem = (id: string, field: keyof PItem, value: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  const addComponent = (itemId: string) => {
    setItems(prev => prev.map(i => {
      if (i.id === itemId) {
        return { ...i, components: [...i.components, { id: crypto.randomUUID(), medicineId: "", quantityPerPackage: 1 }] }
      }
      return i
    }))
  }

  const updateComponent = (itemId: string, compId: string, field: string, value: any) => {
    setItems(prev => prev.map(i => {
      if (i.id === itemId) {
        return {
          ...i,
          components: i.components.map(c => c.id === compId ? { ...c, [field]: value } : c)
        }
      }
      return i
    }))
  }

  const removeComponent = (itemId: string, compId: string) => {
    setItems(prev => prev.map(i => {
      if (i.id === itemId) {
        return { ...i, components: i.components.filter(c => c.id !== compId) }
      }
      return i
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.doctorName || !form.patientName) return toast.error("Nama dokter dan pasien wajib diisi")
    if (items.length === 0) return toast.error("Minimal 1 obat/racikan")

    const payload: PrescriptionInput = {
      doctorName: form.doctorName,
      patientName: form.patientName,
      patientAge: form.patientAge ? parseInt(form.patientAge) : undefined,
      patientAddress: form.patientAddress,
      patientPhone: form.patientPhone,
      notes: form.notes,
      items: items.map(i => {
        if (i.isCompounded) {
          return {
            isCompounded: true,
            compoundedName: i.compoundedName,
            compoundingFee: i.compoundingFee,
            quantity: i.quantity,
            instructions: i.instructions,
            components: i.components.map(c => ({ medicineId: c.medicineId, quantityPerPackage: c.quantityPerPackage }))
          }
        } else {
          return {
            isCompounded: false,
            medicineId: i.medicineId,
            quantity: i.quantity,
            instructions: i.instructions,
          }
        }
      }) as any
    }

    setIsProcessing(true)
    const res = await createPrescriptionAction(payload)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Resep berhasil disimpan")
      setForm({ doctorName: "", patientName: "", patientAge: "", patientAddress: "", patientPhone: "", notes: "" })
      setItems([])
    }
    setIsProcessing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Input Resep Digital</h1>
          <p className="text-muted-foreground">Catat resep dokter dan racikan secara digital</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pasien & Dokter</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Dokter *</Label>
              <Input required value={form.doctorName} onChange={e => setForm({...form, doctorName: e.target.value})} placeholder="dr. Budi" />
            </div>
            <div className="space-y-2">
              <Label>Nama Pasien *</Label>
              <Input required value={form.patientName} onChange={e => setForm({...form, patientName: e.target.value})} placeholder="Tn. Andi" />
            </div>
            <div className="space-y-2">
              <Label>Umur (Tahun)</Label>
              <Input type="number" value={form.patientAge} onChange={e => setForm({...form, patientAge: e.target.value})} placeholder="25" />
            </div>
            <div className="space-y-2">
              <Label>Telepon</Label>
              <Input value={form.patientPhone} onChange={e => setForm({...form, patientPhone: e.target.value})} placeholder="08..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Alamat</Label>
              <Input value={form.patientAddress} onChange={e => setForm({...form, patientAddress: e.target.value})} placeholder="Alamat lengkap..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Daftar Obat</CardTitle>
              <CardDescription>Tambahkan obat standar atau racikan</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => addItem(false)}>
                <Plus className="w-4 h-4 mr-2" /> Obat Standar
              </Button>
              <Button type="button" variant="secondary" onClick={() => addItem(true)}>
                <Plus className="w-4 h-4 mr-2" /> Racikan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-md bg-muted/20 relative">
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeItem(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>

                <h4 className="font-semibold mb-3">#{index + 1} - {item.isCompounded ? "Racikan" : "Obat Standar"}</h4>

                {!item.isCompounded ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Pilih Obat</Label>
                      <Select value={item.medicineId} onValueChange={(v) => updateItem(item.id, "medicineId", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih..." />
                        </SelectTrigger>
                        <SelectContent>
                          {medicines.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Jumlah</Label>
                      <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Aturan Pakai / Signa</Label>
                      <Input value={item.instructions} onChange={(e) => updateItem(item.id, "instructions", e.target.value)} placeholder="3 x 1 sesudah makan" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs">Nama Racikan</Label>
                        <Input value={item.compoundedName} onChange={(e) => updateItem(item.id, "compoundedName", e.target.value)} placeholder="Misal: Puyer Batuk Anak" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Jumlah Paket (Bungkus)</Label>
                        <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Biaya Racik</Label>
                        <Input type="number" value={item.compoundingFee} onChange={(e) => updateItem(item.id, "compoundingFee", parseFloat(e.target.value))} />
                      </div>
                    </div>

                    <div className="p-3 border rounded-md bg-background">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-semibold text-xs">Komponen Obat</Label>
                        <Button type="button" variant="ghost" size="sm" onClick={() => addComponent(item.id)}>
                          <Plus className="w-3 h-3 mr-1" /> Tambah Komponen
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {item.components.map((comp, cIdx) => (
                          <div key={comp.id} className="flex gap-2 items-center">
                            <Select value={comp.medicineId} onValueChange={(v) => updateComponent(item.id, comp.id, "medicineId", v)}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Pilih obat..." />
                              </SelectTrigger>
                              <SelectContent>
                                {medicines.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              className="w-32"
                              placeholder="Qty per bks"
                              value={comp.quantityPerPackage}
                              onChange={(e) => updateComponent(item.id, comp.id, "quantityPerPackage", parseFloat(e.target.value))}
                            />
                            <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeComponent(item.id, comp.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Aturan Pakai / Signa</Label>
                      <Input value={item.instructions} onChange={(e) => updateItem(item.id, "instructions", e.target.value)} placeholder="3 x 1 bungkus sesudah makan" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-6 text-muted-foreground border border-dashed rounded-md">
                Belum ada obat yang ditambahkan
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isProcessing || items.length === 0}>
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Resep
          </Button>
        </div>
      </form>
    </div>
  )
}
