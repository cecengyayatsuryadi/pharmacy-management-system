"use client"

import * as React from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { toast } from "sonner"
import { updateOrganizationAction } from "@/lib/actions/organization"
import { SaveIcon, Loader2Icon, Building2Icon } from "lucide-react"
import type { Organization } from "@workspace/database"

export function OrganizationForm({ organization }: { organization: Organization }) {
  const [state, action] = useActionState(updateOrganizationAction, null)
  
  React.useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
    } else if (state?.message && !state?.success) {
      toast.error(state.message)
    }
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2Icon className="size-5" />
          Detail Apotek
        </CardTitle>
        <CardDescription>
          Informasi ini akan muncul pada struk transaksi pelanggan.
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Apotek</Label>
            <Input id="name" name="name" defaultValue={organization.name} required />
            {state?.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Nomor Telepon Bisnis</Label>
            <Input id="phone" name="phone" defaultValue={organization.phone || ""} placeholder="Contoh: 021-xxxxxx" />
            {state?.errors?.phone && (
              <p className="text-sm text-destructive">{state.errors.phone[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Alamat Lengkap</Label>
            <Textarea id="address" name="address" defaultValue={organization.address || ""} placeholder="Alamat fisik apotek..." />
            {state?.errors?.address && (
              <p className="text-sm text-destructive">{state.errors.address[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi Singkat (Opsional)</Label>
            <Textarea id="description" name="description" defaultValue={organization.description || ""} placeholder="Informasi tambahan apotek..." />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-4">
          <SubmitButton>Simpan Pengaturan</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  )
}

function SubmitButton({ children }: { children: React.ReactNode }) {
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
          <SaveIcon className="mr-2 size-4" />
          {children}
        </>
      )}
    </Button>
  )
}
