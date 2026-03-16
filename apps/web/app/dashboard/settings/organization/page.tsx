import { auth } from "@/auth"
import { db, organizations } from "@workspace/database"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { OrganizationForm } from "./organization-form"

export default async function OrganizationSettingsPage() {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  const role = session?.user?.role

  if (!organizationId) {
    redirect("/login")
  }

  if (role !== "admin") {
    redirect("/dashboard")
  }

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  })

  if (!organization) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Pengaturan Apotek</h2>
        <p className="text-muted-foreground">
          Kelola informasi bisnis apotek Anda untuk struk dan laporan.
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <OrganizationForm organization={organization} />
      </div>
    </div>
  )
}
