import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"

export default function ProcurementReturnsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Retur Supplier</CardTitle>
        <CardDescription>
          Halaman ini disiapkan sebagai fondasi. Implementasi alur retur supplier dilanjutkan di tahap berikutnya.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Sementara gunakan riwayat stok keluar untuk pencatatan manual retur.
      </CardContent>
    </Card>
  )
}
