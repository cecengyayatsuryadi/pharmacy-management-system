"use client"

import { useActionState } from "react"
import { loginAction } from "@/lib/actions/auth"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, action, isPending] = useActionState(loginAction, undefined)

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form action={action} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Selamat datang kembali</h1>
                <p className="text-balance text-muted-foreground">
                  Masuk ke akun Manajemen Apotek Anda
                </p>
              </div>

              {state?.message && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {state.message}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@apotek.com"
                  autoComplete="email"
                  required
                  suppressHydrationWarning
                />
                {state?.errors?.email && (
                  <p className="text-xs text-destructive">{state.errors.email}</p>
                )}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Lupa password?
                  </a>
                </div>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  autoComplete="current-password"
                  required 
                  suppressHydrationWarning
                />
                {state?.errors?.password && (
                  <p className="text-xs text-destructive">{state.errors.password}</p>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Sedang masuk..." : "Masuk"}
                </Button>
              </Field>
              
              <FieldDescription className="text-center">
                Belum punya akun? <a href="/signup" className="underline underline-offset-4">Daftar</a>
              </FieldDescription>
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
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Satu Tempat untuk Operasional Apotek</h2>
                <p className="mx-auto max-w-[280px] text-sm text-muted-foreground">
                  Pantau stok, transaksi, dan laporan secara real-time dari mana saja dengan sistem yang handal.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Dengan masuk, Anda menyetujui <a href="#">Syarat & Ketentuan</a> kami.
      </FieldDescription>
    </div>
  )
}
