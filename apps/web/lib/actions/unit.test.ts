import { describe, it, expect, vi, beforeEach } from "vitest"
import { getUnitsAction, createUnitAction, updateUnitAction, deleteUnitAction } from "./unit"
import { auth } from "@/auth"
import { db } from "@workspace/database"
import { revalidatePath } from "next/cache"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@workspace/database", () => ({
  db: {
    query: {
      units: { findMany: vi.fn() },
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
  units: { id: "id", organizationId: "organizationId", name: "name" },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  count: vi.fn(),
  ilike: vi.fn(),
  asc: vi.fn(),
}))

describe("Unit Actions", () => {
  const mockSession = { user: { id: "user-1", organizationId: "org-1", role: "admin" } }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockImplementation(async () => mockSession as any)
  })

  describe("getUnitsAction", () => {
    it("should return units list", async () => {
      vi.mocked(db.query.units.findMany).mockResolvedValue([{ id: "u1", name: "Pcs" }] as any)
      const result = await getUnitsAction()
      expect(result.data).toHaveLength(1)
    })
  })

  describe("createUnitAction", () => {
    it("should create unit successfully", async () => {
      vi.mocked(db.insert).mockReturnValue({ values: vi.fn().mockResolvedValue({}) } as any)
      const fd = new FormData()
      fd.append("name", "Bottle")
      fd.append("abbreviation", "Btl")

      const result = await createUnitAction(null, fd)
      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalled()
    })
  })
})
