import { db, organizations } from "@workspace/database"
import { eq } from "drizzle-orm"

export async function getOrganizationPlan(organizationId: string) {
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    columns: {
      plan: true,
    },
  })

  return organization?.plan ?? "gratis"
}

export async function getFormattedOrganizationPlan(organizationId: string) {
  const plan = await getOrganizationPlan(organizationId)
  return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase()
}
