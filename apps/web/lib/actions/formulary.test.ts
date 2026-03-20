import { describe, it, expect, vi, beforeEach } from "vitest"
import { getFormulariesAction, upsertFormularyAction, getSubstitutionsAction } from "./formulary"
import { auth } from "@/auth"
import { db } from "@workspace/database"
import { revalidatePath } from "next/cache"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@workspace/database", () => ({
  db: {
    query: {
      medicineFormularies: { findMany: vi.fn() },
      medicineSubstitutions: { findMany: vi.fn() },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ value: 0 }])),
      })),
    })),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  medicineFormularies: { organizationId: "organizationId", medicineId: "medicineId" },
  medicineSubstitutions: { organizationId: "organizationId" },
  medicines: { id: "id", name: "name", organizationId: "organizationId" },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  count: vi.fn(),
  ilike: vi.fn(),
  or: vi.fn(),
  desc: vi.fn(),
  exists: vi.fn((val) => val), // Mock exists to return its input for inspection if needed
}))

describe("Formulary Actions", () => {
  const mockSession = { user: { id: "user-1", organizationId: "org-1", role: "admin" } }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockImplementation(async () => mockSession as any)
  })

  describe("getFormulariesAction", () => {
    it("should return formulary list", async () => {
      vi.mocked(db.query.medicineFormularies.findMany).mockResolvedValue([] as any)
      const result = await getFormulariesAction()
      expect(result.data).toBeDefined()
    })

    it("should handle search with exists subquery", async () => {
      vi.mocked(db.query.medicineFormularies.findMany).mockResolvedValue([] as any)
      await getFormulariesAction(1, 10, "paracetamol")
      
      // Verification: db.select should be called for the exists subquery
      expect(db.select).toHaveBeenCalled()
    })
  })

  describe("upsertFormularyAction", () => {
    it("should create new formulary if no id provided", async () => {
      vi.mocked(db.insert).mockReturnValue({ values: vi.fn().mockResolvedValue({}) } as any)
      const fd = new FormData()
      fd.append("medicineId", "00000000-0000-0000-0000-000000000001")
      fd.append("type", "Fornas")

      const result = await upsertFormularyAction(null, fd)
      expect(result.success).toBe(true)
      expect(db.insert).toHaveBeenCalled()
    })

    it("should update existing formulary if id provided", async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: "f1" }])
          })
        })
      } as any)
      
      const fd = new FormData()
      fd.append("id", "f1")
      fd.append("medicineId", "00000000-0000-0000-0000-000000000001")
      fd.append("type", "Fornas")

      const result = await upsertFormularyAction(null, fd)
      expect(result.success).toBe(true)
      expect(db.update).toHaveBeenCalled()
    })
  })
})
