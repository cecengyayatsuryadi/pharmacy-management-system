import { auth } from "@/auth"
import { db, medicines, organizations } from "@workspace/database"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { PrescriptionClient } from "./prescription-client"

export default async function PrescriptionsPage() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    redirect("/login")
  }

  const [allMedicines, orgData] = await Promise.all([
    db.query.medicines.findMany({
      where: eq(medicines.organizationId, organizationId),
      orderBy: (medicines, { asc }) => [asc(medicines.name)],
    }),
    db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    })
  ])

  if (!orgData) {
    redirect("/login")
  }

  const mappedMedicines = allMedicines.map(m => ({
    id: m.id,
    name: m.name,
    sku: m.sku,
    stock: m.stock,
    price: m.price || "0",
  }))

  return (
    <PrescriptionClient medicines={mappedMedicines} />
  )
}
