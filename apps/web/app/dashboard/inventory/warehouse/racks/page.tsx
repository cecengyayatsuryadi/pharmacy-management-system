import { InventoryModuleTemplate } from "../../components/inventory-module-template"

const initialRows = [
  {
    id: "rack-1",
    rackCode: "R-UTM-A1-01",
    warehouse: "Gudang Utama",
    zone: "Zona A1",
    capacity: "180 box",
    temperature: "25°C",
    status: "Aktif",
  },
  {
    id: "rack-2",
    rackCode: "R-ETL-B2-03",
    warehouse: "Gudang Etalase",
    zone: "Zona B2",
    capacity: "90 box",
    temperature: "23°C",
    status: "Aktif",
  },
]

export default function WarehouseRacksPage() {
  return (
    <InventoryModuleTemplate
      title="Lokasi Rak"
      description="Atur lokasi rak penyimpanan untuk memudahkan picking, replenishment, dan audit stok."
      formTitle="Tambah Lokasi Rak"
      formDescription="Masukkan detail rak untuk standarisasi tata letak gudang."
      submitLabel="Tambah Rak"
      searchPlaceholder="Cari kode rak, gudang, atau zona..."
      emptyMessage="Belum ada data lokasi rak."
      columns={[
        { key: "rackCode", label: "Kode Rak", mono: true },
        { key: "warehouse", label: "Gudang" },
        { key: "zone", label: "Zona" },
        { key: "capacity", label: "Kapasitas" },
        { key: "temperature", label: "Suhu" },
        { key: "status", label: "Status", badge: true },
      ]}
      fields={[
        {
          key: "rackCode",
          label: "Kode Rak",
          required: true,
          placeholder: "Contoh: R-UTM-A3-02",
        },
        {
          key: "warehouse",
          label: "Gudang",
          required: true,
          placeholder: "Contoh: Gudang Utama",
        },
        {
          key: "zone",
          label: "Zona",
          required: true,
          placeholder: "Contoh: Zona A3",
        },
        {
          key: "capacity",
          label: "Kapasitas",
          required: true,
          placeholder: "Contoh: 120 box",
        },
        {
          key: "temperature",
          label: "Suhu Rata-rata",
          required: true,
          placeholder: "Contoh: 24°C",
        },
        {
          key: "status",
          label: "Status",
          type: "select",
          required: true,
          placeholder: "Pilih status",
          options: [
            { label: "Aktif", value: "Aktif" },
            { label: "Maintenance", value: "Maintenance" },
            { label: "Nonaktif", value: "Nonaktif" },
          ],
        },
      ]}
      initialRows={initialRows}
    />
  )
}
