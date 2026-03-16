"use client"

import { useActionState } from "react"
import { signupAction } from "@/lib/actions/auth"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, action, isPending] = useActionState(signupAction, undefined)

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form action={action} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Daftar Akun Baru</h1>
                <p className="text-balance text-muted-foreground">
                  Buat akun untuk mulai mengelola apotek Anda.
                </p>
              </div>

              {state?.message && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {state.message}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="organizationName">Nama Apotek</FieldLabel>
                <Input
                  id="organizationName"
                  name="organizationName"
                  placeholder="Apotek Sehat Jaya"
                  required
                />
                {state?.errors?.organizationName && (
                  <p className="text-xs text-destructive">{state.errors.organizationName}</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  placeholder="Budi Santoso"
                  required
                />
                {state?.errors?.name && (
                  <p className="text-xs text-destructive">{state.errors.name}</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
                {state?.errors?.email && (
                  <p className="text-xs text-destructive">{state.errors.email}</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input id="password" name="password" type="password" required />
                {state?.errors?.password && (
                  <p className="text-xs text-destructive">{state.errors.password}</p>
                )}
              </Field>

              <Field>
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Mendaftarkan..." : "Daftar"}
                </Button>
              </Field>

              <div className="text-center text-sm">
                Sudah punya akun?{" "}
                <a href="/login" className="underline underline-offset-4">
                  Login
                </a>
              </div>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <div className="absolute inset-0 z-0 opacity-10 [background-image:linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [background-size:24px_24px]"></div>
            <div className="relative z-10 flex h-full flex-col items-center justify-center p-12 text-center">
              <img
                src="/logos/logo.svg"
                alt="Logo Apotek"
                className="size-32 object-contain"
              />
              <div className="mt-8 flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Siap Modernisasi Apotek Anda?</h2>
                <p className="mx-auto max-w-[280px] text-sm text-muted-foreground">
                  Dapatkan kontrol penuh atas inventaris, expired date, dan keuangan hanya dalam hitungan menit.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Dengan mendaftar, Anda menyetujui <a href="#">Syarat & Ketentuan</a> kami.
      </FieldDescription>
    </div>
  )
}
