import { auth } from "@/auth"
import { db, medicines, organizations } from "@workspace/database"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { POSClient } from "./pos-client"

export default async function POSPage() {
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

  return (
    <POSClient medicines={allMedicines} organization={orgData} />
  )
}
