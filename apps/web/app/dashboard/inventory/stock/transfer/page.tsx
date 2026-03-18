import { InventoryModuleTemplate } from "../../components/inventory-module-template"

const initialRows = [
  {
    id: "trf-1",
    transferNumber: "TRF-202603-0007",
    medicine: "Cetirizine 10mg",
    fromWarehouse: "Gudang Utama",
    toWarehouse: "Gudang Etalase",
    quantity: "50",
    status: "Selesai",
  },
  {
    id: "trf-2",
    transferNumber: "TRF-202603-0008",
    medicine: "Omeprazole 20mg",
    fromWarehouse: "Gudang Utama",
    toWarehouse: "Gudang Cabang A",
    quantity: "40",
    status: "Menunggu",
  },
]

export default function StockTransferPage() {
  return (
    <InventoryModuleTemplate
      title="Transfer Antar Gudang"
      description="Kelola perpindahan stok antar gudang dengan kontrol status dan nomor dokumen transfer."
      formTitle="Buat Transfer Antar Gudang"
      formDescription="Isi detail transfer untuk memastikan perpindahan stok tercatat dengan benar."
      submitLabel="Buat Transfer"
      searchPlaceholder="Cari nomor transfer, obat, atau gudang..."
      emptyMessage="Belum ada transaksi transfer antar gudang."
      columns={[
        { key: "transferNumber", label: "Nomor Transfer", mono: true },
        { key: "medicine", label: "Obat" },
        { key: "fromWarehouse", label: "Dari Gudang" },
        { key: "toWarehouse", label: "Ke Gudang" },
        { key: "quantity", label: "Qty", align: "right", mono: true },
        { key: "status", label: "Status", badge: true },
      ]}
      fields={[
        {
          key: "transferNumber",
          label: "Nomor Transfer",
          required: true,
          placeholder: "Contoh: TRF-202603-0011",
        },
        {
          key: "medicine",
          label: "Nama Obat",
          required: true,
          placeholder: "Contoh: Amoxicillin 500mg",
        },
        {
          key: "fromWarehouse",
          label: "Gudang Asal",
          required: true,
          placeholder: "Contoh: Gudang Utama",
        },
        {
          key: "toWarehouse",
          label: "Gudang Tujuan",
          required: true,
          placeholder: "Contoh: Gudang Etalase",
        },
        {
          key: "quantity",
          label: "Jumlah Transfer",
          type: "number",
          required: true,
          placeholder: "0",
        },
        {
          key: "status",
          label: "Status",
          type: "select",
          required: true,
          placeholder: "Pilih status transfer",
          options: [
            { label: "Menunggu", value: "Menunggu" },
            { label: "Dalam Proses", value: "Dalam Proses" },
            { label: "Selesai", value: "Selesai" },
          ],
        },
      ]}
      initialRows={initialRows}
    />
  )
}
