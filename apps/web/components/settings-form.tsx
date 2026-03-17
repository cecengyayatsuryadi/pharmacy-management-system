"use client"

import * as React from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { toast } from "sonner"
import { updateProfileAction, updatePasswordAction } from "@/lib/actions/user"
import { SaveIcon, KeyIcon, Loader2Icon } from "lucide-react"
import { type Session } from "next-auth"

type ProfileFormUser = Pick<Session["user"], "id" | "name" | "email" | "phone">

export function ProfileForm({ user, withCard = true }: { user: ProfileFormUser; withCard?: boolean }) {
  const [state, action] = useActionState(updateProfileAction, null)
  
  React.useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
    } else if (state?.message && !state?.success) {
      toast.error(state.message)
    }
  }, [state])

  const formBody = (
    <form action={action}>
      <CardContent className={withCard ? "space-y-4" : "space-y-4 px-0"}>
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
              {user.email ?? "-"}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" name="name" defaultValue={user.name ?? ""} required />
            {state?.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input id="phone" name="phone" defaultValue={user.phone ?? ""} placeholder="0812..." />
            {state?.errors?.phone && (
              <p className="text-sm text-destructive">{state.errors.phone[0]}</p>
            )}
          </div>
      </CardContent>
      <CardFooter className={withCard ? "flex justify-end pt-4" : "flex justify-end px-0 pt-4"}>
          <SubmitButton icon={<SaveIcon className="mr-2 size-4" />}>
            Simpan Perubahan
          </SubmitButton>
      </CardFooter>
    </form>
  )

  if (!withCard) return formBody

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Saya</CardTitle>
        <CardDescription>
          Perbarui informasi publik dan nomor telepon Anda.
        </CardDescription>
      </CardHeader>
      {formBody}
    </Card>
  )
}

export function PasswordForm({ withCard = true }: { withCard?: boolean }) {
  const [state, action] = useActionState(updatePasswordAction, null)
  const formRef = React.useRef<HTMLFormElement>(null)
  
  React.useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
      formRef.current?.reset()
    } else if (state?.message && !state?.success) {
      toast.error(state.message)
    }
  }, [state])

  const formBody = (
    <form action={action} ref={formRef}>
      <CardContent className={withCard ? "space-y-4" : "space-y-4 px-0"}>
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Password Saat Ini</Label>
            <Input id="currentPassword" name="currentPassword" type="password" required />
            {state?.errors?.currentPassword && (
              <p className="text-sm text-destructive">{state.errors.currentPassword[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Password Baru</Label>
            <Input id="newPassword" name="newPassword" type="password" required />
            {state?.errors?.newPassword && (
              <p className="text-sm text-destructive">{state.errors.newPassword[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required />
            {state?.errors?.confirmPassword && (
              <p className="text-sm text-destructive">{state.errors.confirmPassword[0]}</p>
            )}
          </div>
      </CardContent>
      <CardFooter className={withCard ? "flex justify-end pt-4" : "flex justify-end px-0 pt-4"}>
          <SubmitButton icon={<KeyIcon className="mr-2 size-4" />}>
            Update Password
          </SubmitButton>
      </CardFooter>
    </form>
  )

  if (!withCard) return formBody

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ganti Password</CardTitle>
        <CardDescription>
          Pastikan password Anda kuat dan aman.
        </CardDescription>
      </CardHeader>
      {formBody}
    </Card>
  )
}

function SubmitButton({ children, icon }: { children: React.ReactNode, icon?: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="min-w-[120px]">
      {pending ? (
        <>
          <Loader2Icon className="mr-2 size-4 animate-spin" />
          Menyimpan...
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </Button>
  )
}
