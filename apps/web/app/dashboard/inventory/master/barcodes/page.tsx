import { InventoryModuleTemplate } from "../../components/inventory-module-template"

const initialRows = [
  {
    id: "bc-1",
    barcode: "8999908001001",
    medicine: "Paracetamol 500mg",
    format: "EAN-13",
    status: "Aktif",
    updatedAt: "2026-03-18",
  },
  {
    id: "bc-2",
    barcode: "MED-IBUPRO-200-01",
    medicine: "Ibuprofen 200mg",
    format: "Code-128",
    status: "Aktif",
    updatedAt: "2026-03-17",
  },
]

export default function BarcodeManagerPage() {
  return (
    <InventoryModuleTemplate
      title="Barcode Manager"
      description="Kelola barcode produk untuk mempercepat proses scan saat pembelian, stok opname, dan POS."
      formTitle="Tambah Barcode Produk"
      formDescription="Hubungkan barcode ke produk obat agar identifikasi item lebih cepat dan akurat."
      submitLabel="Tambah Barcode"
      searchPlaceholder="Cari barcode atau nama obat..."
      emptyMessage="Belum ada barcode yang terdaftar."
      columns={[
        { key: "barcode", label: "Barcode", mono: true },
        { key: "medicine", label: "Produk" },
        { key: "format", label: "Format", badge: true },
        { key: "status", label: "Status", badge: true },
        { key: "updatedAt", label: "Update Terakhir" },
      ]}
      fields={[
        {
          key: "barcode",
          label: "Kode Barcode",
          required: true,
          placeholder: "Contoh: 8999908001001",
        },
        {
          key: "medicine",
          label: "Nama Produk",
          required: true,
          placeholder: "Contoh: Paracetamol 500mg",
        },
        {
          key: "format",
          label: "Format",
          type: "select",
          required: true,
          placeholder: "Pilih format barcode",
          options: [
            { label: "EAN-13", value: "EAN-13" },
            { label: "Code-128", value: "Code-128" },
            { label: "QR Code", value: "QR Code" },
          ],
        },
        {
          key: "status",
          label: "Status",
          type: "select",
          required: true,
          placeholder: "Pilih status",
          options: [
            { label: "Aktif", value: "Aktif" },
            { label: "Nonaktif", value: "Nonaktif" },
          ],
        },
      ]}
      initialRows={initialRows}
    />
  )
}
