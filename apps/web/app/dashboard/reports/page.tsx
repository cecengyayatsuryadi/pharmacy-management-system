import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getSalesReportAction } from "@/lib/actions/report"
import { ReportClient } from "./report-client"
import { startOfMonth, endOfMonth } from "date-fns"

export default async function ReportsPage() {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  const role = session?.user?.role
  const plan = session?.user?.organizationPlan

  if (!organizationId) {
    redirect("/login")
  }

  // RBAC Check
  if (role !== "admin") {
    redirect("/dashboard")
  }

  // Initial load: current month
  const initialFilter = {
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
  }

  const initialData = await getSalesReportAction(initialFilter)

  return (
    <ReportClient 
      initialData={initialData} 
      initialFilter={initialFilter}
      plan={plan || "gratis"}
    />
  )
}
