import { describe, it, expect, vi, beforeEach } from "vitest"
import { getMedicineGroups, createMedicineGroupAction, updateMedicineGroupAction, deleteMedicineGroupAction } from "./medicine-group"
import { auth } from "@/auth"
import { db } from "@workspace/database"
import { revalidatePath } from "next/cache"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@workspace/database", () => ({
  db: {
    query: {
      medicineGroups: { findMany: vi.fn() },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            groupBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                offset: vi.fn(() => ({
                  orderBy: vi.fn(() => Promise.resolve([{ id: "grp-1", name: "Golongan A", value: 3 }])),
                })),
              })),
            })),
          })),
        })),
        where: vi.fn(() => Promise.resolve([{ value: 0 }])),
      })),
    })),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  medicineGroups: { id: "id", organizationId: "organizationId", createdAt: "createdAt", name: "name" },
  medicines: { groupId: "groupId", organizationId: "organizationId" },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  count: vi.fn(),
  ilike: vi.fn(),
  sql: vi.fn(),
}))

describe("Medicine Group Actions", () => {
  const mockSession = { user: { id: "user-1", organizationId: "org-1", role: "admin" } }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockImplementation(async () => mockSession as any)
  })

  describe("getMedicineGroups", () => {
    it("should return groups list", async () => {
      const result = await getMedicineGroups()
      expect(result.data).toBeDefined()
      expect(db.select).toHaveBeenCalled()
    })
  })

  describe("createMedicineGroupAction", () => {
    it("should create group and revalidate", async () => {
      vi.mocked(db.insert).mockReturnValue({ values: vi.fn().mockResolvedValue({}) } as any)
      const fd = new FormData()
      fd.append("name", "Narkotika")
      fd.append("color", "#ff0000")

      const result = await createMedicineGroupAction(null, fd)
      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalled()
    })
  })

  describe("deleteMedicineGroupAction", () => {
    it("should fail if there are medicines in this group", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 3 }])
        })
      } as any)

      const result = await deleteMedicineGroupAction("grp-1")
      expect(result.success).toBe(false)
      expect(result.message).toContain("Masih ada 3 produk")
    })
  })
})
