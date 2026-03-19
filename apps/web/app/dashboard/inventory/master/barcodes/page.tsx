import { BarcodeClient } from "./barcode-client"

// Mock data for now, would typically come from a Server Action
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
    <BarcodeClient initialRows={initialRows} />
  )
}
