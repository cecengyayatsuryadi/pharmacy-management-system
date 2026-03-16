import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db, users } from "@workspace/database"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface User {
    role?: string | null
    organizationId?: string | null
    organizationName?: string | null
    organizationPlan?: string | null
    status?: string | null
    phone?: string | null
  }
  interface Session {
    user: User
  }
  interface JWT {
    role?: string | null
    organizationId?: string | null
    organizationName?: string | null
    organizationPlan?: string | null
    status?: string | null
    phone?: string | null
  }
}

export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const { email, password } = credentials

        const user = await db.query.users.findFirst({
          where: eq(users.email, email as string),
          with: {
            organization: true,
          }
        })

        if (!user || !user.password) {
          return null
        }

        const passwordMatch = await bcrypt.compare(password as string, user.password)

        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization?.name,
          organizationPlan: user.organization?.plan,
          status: user.status,
          phone: user.phone,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
        token.organizationName = user.organizationName
        token.organizationPlan = user.organizationPlan
        token.status = user.status
        token.phone = user.phone
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
        session.user.organizationName = token.organizationName as string
        session.user.organizationPlan = token.organizationPlan as string
        session.user.status = token.status as string
        session.user.phone = token.phone as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig
