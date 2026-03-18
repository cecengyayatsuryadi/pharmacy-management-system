import { InventoryModuleTemplate } from "../../components/inventory-module-template"

const initialRows = [
  {
    id: "dsp-1",
    disposalNumber: "DSP-202603-0003",
    medicine: "Cetirizine 10mg",
    batchNumber: "BATCH-CTZ-202601",
    quantity: "20",
    method: "Insinerasi",
    approvedBy: "Apoteker PJ",
    status: "Selesai",
  },
  {
    id: "dsp-2",
    disposalNumber: "DSP-202603-0004",
    medicine: "Ranitidine 150mg",
    batchNumber: "BATCH-RNT-202602",
    quantity: "12",
    method: "Pihak Ketiga",
    approvedBy: "Kepala Gudang",
    status: "Menunggu Verifikasi",
  },
]

export default function DrugDisposalPage() {
  return (
    <InventoryModuleTemplate
      title="Pemusnahan Obat"
      description="Kelola proses pemusnahan obat rusak atau kadaluarsa dengan jejak audit yang jelas."
      formTitle="Catat Pemusnahan Obat"
      formDescription="Isi data pemusnahan untuk kebutuhan kepatuhan, audit internal, dan pelaporan."
      submitLabel="Tambah Pemusnahan"
      searchPlaceholder="Cari nomor pemusnahan, obat, atau batch..."
      emptyMessage="Belum ada data pemusnahan obat."
      columns={[
        { key: "disposalNumber", label: "Nomor", mono: true },
        { key: "medicine", label: "Obat" },
        { key: "batchNumber", label: "Batch", mono: true },
        { key: "quantity", label: "Qty", align: "right", mono: true },
        { key: "method", label: "Metode" },
        { key: "approvedBy", label: "Disetujui" },
        { key: "status", label: "Status", badge: true },
      ]}
      fields={[
        {
          key: "disposalNumber",
          label: "Nomor Pemusnahan",
          required: true,
          placeholder: "Contoh: DSP-202603-0012",
        },
        {
          key: "medicine",
          label: "Nama Obat",
          required: true,
          placeholder: "Contoh: Amoxicillin 500mg",
        },
        {
          key: "batchNumber",
          label: "Nomor Batch",
          required: true,
          placeholder: "Contoh: BATCH-AMX-202601",
        },
        {
          key: "quantity",
          label: "Jumlah Dimusnahkan",
          type: "number",
          required: true,
          placeholder: "0",
        },
        {
          key: "method",
          label: "Metode Pemusnahan",
          type: "select",
          required: true,
          placeholder: "Pilih metode",
          options: [
            { label: "Insinerasi", value: "Insinerasi" },
            { label: "Pihak Ketiga", value: "Pihak Ketiga" },
            { label: "Chemical Disposal", value: "Chemical Disposal" },
          ],
        },
        {
          key: "approvedBy",
          label: "Disetujui Oleh",
          required: true,
          placeholder: "Contoh: Apoteker PJ",
        },
        {
          key: "status",
          label: "Status",
          type: "select",
          required: true,
          placeholder: "Pilih status",
          options: [
            { label: "Menunggu Verifikasi", value: "Menunggu Verifikasi" },
            { label: "Disetujui", value: "Disetujui" },
            { label: "Selesai", value: "Selesai" },
          ],
        },
      ]}
      initialRows={initialRows}
    />
  )
}
