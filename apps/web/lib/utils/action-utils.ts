import { auth } from "@/auth"
import { getErrorMessage } from "./error"

export type ActionResponse<T = any> = {
  success?: boolean
  message: string
  errors?: Record<string, string[]>
  data?: T
}

export async function getAuthenticatedSession() {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  const userId = session?.user?.id
  const role = session?.user?.role

  if (!organizationId || !userId) {
    throw new Error("Unauthorized")
  }

  return { session, organizationId, userId, role }
}

export function handleActionError(error: unknown, prefix: string): ActionResponse {
  console.error(`${prefix}_ERROR:`, error)
  return { 
    success: false, 
    message: `Terjadi kesalahan sistem: ${getErrorMessage(error)}` 
  }
}
