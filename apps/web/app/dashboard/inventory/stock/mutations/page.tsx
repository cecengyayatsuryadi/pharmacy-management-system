import { InventoryModuleTemplate } from "../../components/inventory-module-template"

const initialRows = [
  {
    id: "mut-1",
    date: "2026-03-18 08:10",
    medicine: "Amoxicillin 500mg",
    movementType: "Stok Masuk",
    warehouse: "Gudang Utama",
    quantity: "+120",
    reference: "PO-202603-0021",
  },
  {
    id: "mut-2",
    date: "2026-03-18 10:25",
    medicine: "Paracetamol 500mg",
    movementType: "Stok Keluar",
    warehouse: "Gudang Etalase",
    quantity: "-24",
    reference: "SO-OPN-0318",
  },
]

export default function StockMutationsPage() {
  return (
    <InventoryModuleTemplate
      title="Mutasi Stok"
      description="Pantau seluruh histori pergerakan stok lintas gudang, batch, dan aktivitas operasional."
      formTitle="Catat Mutasi Stok"
      formDescription="Input mutasi stok untuk memperkuat audit trail inventori."
      submitLabel="Catat Mutasi"
      searchPlaceholder="Cari obat, tipe mutasi, gudang, atau referensi..."
      emptyMessage="Belum ada mutasi stok tercatat."
      columns={[
        { key: "date", label: "Tanggal" },
        { key: "medicine", label: "Obat" },
        { key: "movementType", label: "Tipe Mutasi", badge: true },
        { key: "warehouse", label: "Gudang" },
        { key: "quantity", label: "Jumlah", align: "right", mono: true },
        { key: "reference", label: "Referensi", mono: true },
      ]}
      fields={[
        {
          key: "date",
          label: "Tanggal",
          type: "date",
          required: true,
        },
        {
          key: "medicine",
          label: "Nama Obat",
          required: true,
          placeholder: "Contoh: Vitamin C 500mg",
        },
        {
          key: "movementType",
          label: "Tipe Mutasi",
          type: "select",
          required: true,
          placeholder: "Pilih tipe mutasi",
          options: [
            { label: "Stok Masuk", value: "Stok Masuk" },
            { label: "Stok Keluar", value: "Stok Keluar" },
            { label: "Transfer", value: "Transfer" },
            { label: "Penyesuaian", value: "Penyesuaian" },
          ],
        },
        {
          key: "warehouse",
          label: "Gudang",
          required: true,
          placeholder: "Contoh: Gudang Utama",
        },
        {
          key: "quantity",
          label: "Jumlah",
          type: "number",
          required: true,
          placeholder: "0",
        },
        {
          key: "reference",
          label: "Nomor Referensi",
          required: true,
          placeholder: "Contoh: PO-202603-0099",
        },
      ]}
      initialRows={initialRows}
    />
  )
}
