"use server"

import { signIn } from "@/auth"
import { db, users, organizations, memberships } from "@workspace/database"
import { eq } from "drizzle-orm"
import { AuthError } from "next-auth"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { getErrorMessage } from "@/lib/utils/error"

const loginSchema = z.object({
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
})

const signupSchema = z.object({
  name: z.string().min(2, { message: "Nama minimal 2 karakter" }),
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
  organizationName: z.string().min(3, { message: "Nama Apotek minimal 3 karakter" }),
})

export async function loginAction(prevState: any, formData: FormData) {
  const validatedFields = loginSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal login. Mohon periksa input Anda.",
    }
  }

  const { email, password } = validatedFields.data

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { message: "Email atau password salah." }
        default:
          return { message: "Terjadi kesalahan sistem saat login." }
      }
    }
    // Re-throw redirect errors so Next.js can handle them
    throw error
  }
}

export async function signupAction(prevState: any, formData: FormData) {
  const validatedFields = signupSchema.safeParse(
    Object.fromEntries(formData.entries())
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Gagal mendaftar. Mohon periksa input Anda.",
    }
  }

  const { name, email: rawEmail, password, organizationName } = validatedFields.data
  const email = rawEmail.toLowerCase()

  try {
    // 1. Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existingUser) {
      return { message: "Email sudah terdaftar. Silakan gunakan email lain." }
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // 3. Create Organization, User & Membership in a transaction
    await db.transaction(async (tx) => {
      const [newOrg] = await tx
        .insert(organizations)
        .values({
          name: organizationName,
          slug: organizationName.toLowerCase().trim().replace(/\s+/g, "-"),
          plan: "gratis",
        })
        .returning()

      if (!newOrg) {
        throw new Error("Gagal membuat organisasi")
      }

      const [newUser] = await tx.insert(users).values({
        name,
        email,
        password: hashedPassword,
        organizationId: newOrg.id,
        role: "admin", // User pertama pendaftar adalah admin
      }).returning()

      if (!newUser) {
        throw new Error("Gagal membuat akun")
      }

      // Automatically grant membership to the creator for this new organization
      await tx.insert(memberships).values({
        userId: newUser.id,
        organizationId: newOrg.id,
        role: "admin",
      })
    })

    // 4. Sign in automatically after signup
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    })

    return { message: "Pendaftaran berhasil! Mengalihkan..." }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === "NEXT_REDIRECT" || error.name === "NextRedirect")) {
      throw error
    }

    if (error instanceof AuthError) {
      return { message: "Akun berhasil dibuat. Silakan masuk secara manual." }
    }
    
    console.error("SIGNUP_ERROR:", error)
    
    if (error && typeof error === "object" && "code" in error && error.code === "ECONNREFUSED") {
      return { message: "Koneksi ke database gagal. Pastikan Docker sudah jalan." }
    }

    return { message: `Terjadi kesalahan sistem: ${getErrorMessage(error)}` }
  }
}
