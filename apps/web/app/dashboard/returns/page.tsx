import { auth } from "@/auth"
import { db, organizations } from "@workspace/database"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { ReturnClient } from "./return-client"

export default async function ReturnsPage() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    redirect("/login")
  }

  const orgData = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  })

  if (!orgData) {
    redirect("/login")
  }

  return (
    <ReturnClient />
  )
}
