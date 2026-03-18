import { InventoryModuleTemplate } from "../../components/inventory-module-template"

const initialRows = [
  {
    id: "exp-1",
    medicine: "Amoxicillin 500mg",
    batchNumber: "BATCH-AMX-202603",
    warehouse: "Gudang Cabang A",
    expiryDate: "2026-03-28",
    riskLevel: "Tinggi",
    followUp: "Cek fisik",
  },
  {
    id: "exp-2",
    medicine: "Loratadine 10mg",
    batchNumber: "BATCH-LRT-202604",
    warehouse: "Gudang Etalase",
    expiryDate: "2026-04-15",
    riskLevel: "Menengah",
    followUp: "Rotasi rak",
  },
]

export default function ExpiredAlertsPage() {
  return (
    <InventoryModuleTemplate
      title="Alert Expired"
      description="Identifikasi batch yang mendekati kadaluarsa agar tindakan pencegahan bisa dilakukan lebih cepat."
      formTitle="Catat Tindak Lanjut Alert"
      formDescription="Input rencana aksi untuk batch yang terdeteksi berisiko expired."
      submitLabel="Tambah Alert"
      searchPlaceholder="Cari obat, batch, atau level risiko..."
      emptyMessage="Tidak ada alert expired saat ini."
      columns={[
        { key: "medicine", label: "Obat" },
        { key: "batchNumber", label: "Nomor Batch", mono: true },
        { key: "warehouse", label: "Gudang" },
        { key: "expiryDate", label: "Expired" },
        { key: "riskLevel", label: "Level Risiko", badge: true },
        { key: "followUp", label: "Tindak Lanjut" },
      ]}
      fields={[
        {
          key: "medicine",
          label: "Nama Obat",
          required: true,
          placeholder: "Contoh: Omeprazole 20mg",
        },
        {
          key: "batchNumber",
          label: "Nomor Batch",
          required: true,
          placeholder: "Contoh: BATCH-OME-202605",
        },
        {
          key: "warehouse",
          label: "Gudang",
          required: true,
          placeholder: "Contoh: Gudang Utama",
        },
        {
          key: "expiryDate",
          label: "Tanggal Kadaluarsa",
          type: "date",
          required: true,
        },
        {
          key: "riskLevel",
          label: "Level Risiko",
          type: "select",
          required: true,
          placeholder: "Pilih level risiko",
          options: [
            { label: "Tinggi", value: "Tinggi" },
            { label: "Menengah", value: "Menengah" },
            { label: "Rendah", value: "Rendah" },
          ],
        },
        {
          key: "followUp",
          label: "Rencana Tindak Lanjut",
          type: "textarea",
          required: true,
          placeholder: "Contoh: Pisahkan batch, verifikasi fisik, koordinasi retur supplier.",
        },
      ]}
      initialRows={initialRows}
    />
  )
}
