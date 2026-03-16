import { auth } from "@/auth"
import type { NextMiddleware } from "next/server"

const middleware: NextMiddleware = auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard")
  const isOnAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/signup")

  if (isOnDashboard) {
    if (isLoggedIn) return
    return Response.redirect(new URL("/login", req.nextUrl))
  }

  if (isOnAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl))
  }
}) as any // Cast to any because auth() returns a specialized middleware type that TS2742 can't resolve

export default middleware

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
