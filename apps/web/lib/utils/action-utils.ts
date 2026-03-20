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
    return null
  }

  return { session, organizationId, userId, role }
}

export function handleActionError(error: unknown, prefix: string): ActionResponse {
  console.error(`${prefix}_ERROR:`, error)
  
  // Deteksi error database umum (Postgres)
  const errorMessage = getErrorMessage(error)
  
  // Unique constraint violation (e.g., SKU atau Code duplikat)
  if (errorMessage.includes("unique constraint") || errorMessage.includes("already exists")) {
    if (errorMessage.includes("sku")) {
      return { success: false, message: "Gagal: Barcode/SKU sudah digunakan oleh produk lain." }
    }
    if (errorMessage.includes("code")) {
      return { success: false, message: "Gagal: Kode internal sudah digunakan." }
    }
    return { success: false, message: "Gagal: Data dengan identitas tersebut sudah ada." }
  }

  // Foreign key violation (e.g., menghapus data yang masih digunakan)
  if (errorMessage.includes("foreign key constraint")) {
    return { success: false, message: "Gagal: Data ini masih digunakan oleh data lain dan tidak bisa dihapus/diubah." }
  }

  // Default error message (sanitized)
  return { 
    success: false, 
    message: "Terjadi kesalahan sistem. Silakan coba beberapa saat lagi atau hubungi admin." 
  }
}
