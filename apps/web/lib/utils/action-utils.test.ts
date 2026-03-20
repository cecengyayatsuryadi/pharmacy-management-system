import { describe, it, expect, vi, beforeEach } from "vitest"
import { getAuthenticatedSession, handleActionError } from "./action-utils"
import { auth } from "@/auth"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

describe("action-utils", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getAuthenticatedSession", () => {
    it("should return session info if authenticated", async () => {
      const mockSession = {
        user: {
          id: "user-1",
          organizationId: "org-1",
          role: "admin",
        },
      }
      vi.mocked(auth).mockResolvedValue(mockSession as any)

      const result = await getAuthenticatedSession()

      expect(result).toEqual({
        session: mockSession,
        organizationId: "org-1",
        userId: "user-1",
        role: "admin",
      })
    })

    it("should return null if no session", async () => {
      vi.mocked(auth).mockResolvedValue(null)
      const result = await getAuthenticatedSession()
      expect(result).toBeNull()
    })

    it("should return null if missing organizationId", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any)
      const result = await getAuthenticatedSession()
      expect(result).toBeNull()
    })
  })

  describe("handleActionError", () => {
    it("should return sanitized message for unknown errors", () => {
      const error = new Error("Something went wrong")
      const result = handleActionError(error, "TEST")

      expect(result).toEqual({
        success: false,
        message: "Terjadi kesalahan sistem. Silakan coba beberapa saat lagi atau hubungi admin.",
      })
    })

    it("should return specific message for unique constraint on sku", () => {
      const error = new Error('duplicate key value violates unique constraint "sku_org_idx"')
      const result = handleActionError(error, "TEST")

      expect(result.message).toContain("Barcode/SKU sudah digunakan")
    })

    it("should return specific message for unique constraint on code", () => {
      const error = new Error('duplicate key value violates unique constraint "medicine_code_org_idx"')
      const result = handleActionError(error, "TEST")

      expect(result.message).toContain("Kode internal sudah digunakan")
    })

    it("should return specific message for foreign key constraint", () => {
      const error = new Error('violates foreign key constraint "medicines_category_id_fkey"')
      const result = handleActionError(error, "TEST")

      expect(result.message).toContain("Data ini masih digunakan")
    })
  })
})
