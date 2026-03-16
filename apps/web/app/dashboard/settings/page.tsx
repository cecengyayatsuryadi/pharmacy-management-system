import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ProfileForm, PasswordForm } from "@/components/settings-form"
import { DashboardHeader } from "@/components/dashboard-header"

export default async function SettingsPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <ProfileForm user={session.user} />
        <PasswordForm />
      </div>
    </div>
  )
}
