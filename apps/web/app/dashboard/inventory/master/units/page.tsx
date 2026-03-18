import { auth } from "@/auth"
import { getUnitsAction } from "@/lib/actions/unit"
import { UnitClient } from "./unit-client"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Master Satuan | Apotek",
  description: "Kelola satuan produk dan konversi kemasan.",
}

export default async function UnitPage() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    redirect("/login")
  }

  const units = await getUnitsAction()

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <UnitClient initialUnits={units} />
    </div>
  )
}
