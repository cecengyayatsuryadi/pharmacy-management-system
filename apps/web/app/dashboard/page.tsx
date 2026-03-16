import { getDashboardStats } from "@/lib/actions/dashboard"
import { DashboardClient } from "./dashboard-client"

export default async function Page() {
  const stats = await getDashboardStats()

  return (
    <DashboardClient stats={stats} />
  )
}
