import NextAuth from "next-auth"
import type { NextAuthResult } from "next-auth"
import { authConfig } from "./auth.config"

const result: NextAuthResult = NextAuth(authConfig)

export const handlers: NextAuthResult["handlers"] = result.handlers
export const signIn: NextAuthResult["signIn"] = result.signIn
export const signOut: NextAuthResult["signOut"] = result.signOut
export const auth: NextAuthResult["auth"] = result.auth
