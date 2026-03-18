import { InventoryModuleTemplate } from "../components/inventory-module-template"

const initialRows = [
  {
    id: "bt-1",
    batchNumber: "BATCH-PCT-202604",
    medicine: "Paracetamol 500mg",
    warehouse: "Gudang Utama",
    stock: "250",
    expiryDate: "2026-04-30",
    status: "Aman",
  },
  {
    id: "bt-2",
    batchNumber: "BATCH-AMX-202603",
    medicine: "Amoxicillin 500mg",
    warehouse: "Gudang Cabang A",
    stock: "80",
    expiryDate: "2026-03-28",
    status: "Perlu Tindak Lanjut",
  },
]

export default function BatchTrackingPage() {
  return (
    <InventoryModuleTemplate
      title="Tracking Batch"
      description="Lacak batch obat berdasarkan gudang, stok tersisa, dan tanggal kadaluarsa."
      formTitle="Tambah Data Batch"
      formDescription="Masukkan data batch untuk memperkuat pelacakan lot obat dan audit stok."
      submitLabel="Tambah Batch"
      searchPlaceholder="Cari nomor batch, obat, atau gudang..."
      emptyMessage="Belum ada data batch terdaftar."
      columns={[
        { key: "batchNumber", label: "Nomor Batch", mono: true },
        { key: "medicine", label: "Obat" },
        { key: "warehouse", label: "Gudang" },
        { key: "stock", label: "Stok", align: "right", mono: true },
        { key: "expiryDate", label: "Expired" },
        { key: "status", label: "Status", badge: true },
      ]}
      fields={[
        {
          key: "batchNumber",
          label: "Nomor Batch",
          required: true,
          placeholder: "Contoh: BATCH-OBT-202606",
        },
        {
          key: "medicine",
          label: "Nama Obat",
          required: true,
          placeholder: "Contoh: Ibuprofen 200mg",
        },
        {
          key: "warehouse",
          label: "Gudang",
          required: true,
          placeholder: "Contoh: Gudang Utama",
        },
        {
          key: "stock",
          label: "Jumlah Stok",
          type: "number",
          required: true,
          placeholder: "0",
        },
        {
          key: "expiryDate",
          label: "Tanggal Kadaluarsa",
          type: "date",
          required: true,
        },
        {
          key: "status",
          label: "Status",
          type: "select",
          required: true,
          placeholder: "Pilih status",
          options: [
            { label: "Aman", value: "Aman" },
            { label: "Monitoring", value: "Monitoring" },
            { label: "Perlu Tindak Lanjut", value: "Perlu Tindak Lanjut" },
          ],
        },
      ]}
      initialRows={initialRows}
    />
  )
}
