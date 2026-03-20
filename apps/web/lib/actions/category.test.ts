import { describe, it, expect, vi, beforeEach } from "vitest"
import { getCategories, createCategoryAction, updateCategoryAction, deleteCategoryAction } from "./category"
import { auth } from "@/auth"
import { db } from "@workspace/database"
import { revalidatePath } from "next/cache"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@workspace/database", () => ({
  db: {
    query: {
      categories: { findMany: vi.fn() },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            groupBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                offset: vi.fn(() => ({
                  orderBy: vi.fn(() => Promise.resolve([{ id: "cat-1", name: "Obat Luar", value: 5 }])),
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
  categories: { id: "id", organizationId: "organizationId", createdAt: "createdAt", name: "name" },
  medicines: { categoryId: "categoryId", organizationId: "organizationId" },
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

describe("Category Actions", () => {
  const mockSession = { user: { id: "user-1", organizationId: "org-1", role: "admin" } }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockImplementation(async () => mockSession as any)
  })

  describe("getCategories", () => {
    it("should return categories list", async () => {
      const result = await getCategories()
      expect(result.data).toBeDefined()
      expect(db.select).toHaveBeenCalled()
    })
  })

  describe("createCategoryAction", () => {
    it("should return Unauthorized if not logged in", async () => {
      vi.mocked(auth).mockImplementation(async () => null)
      const result = await createCategoryAction(null, new FormData())
      expect(result.message).toBe("Unauthorized")
    })

    it("should create category and revalidate", async () => {
      vi.mocked(db.insert).mockReturnValue({ values: vi.fn().mockResolvedValue({}) } as any)
      const fd = new FormData()
      fd.append("name", "Tablet")
      fd.append("color", "#ff0000")

      const result = await createCategoryAction(null, fd)
      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalled()
    })
  })

  describe("deleteCategoryAction", () => {
    it("should fail if there are medicines in this category", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 5 }]) // 5 medicines exist
        })
      } as any)

      const result = await deleteCategoryAction("cat-1")
      expect(result.success).toBe(false)
      expect(result.message).toContain("Masih ada 5 produk")
    })

    it("should delete successfully if category is empty", async () => {
      // Mock for count check (empty)
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 0 }])
        })
      } as any)

      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "cat-1" }])
        })
      } as any)

      const result = await deleteCategoryAction("cat-1")
      expect(result.success).toBe(true)
      expect(db.delete).toHaveBeenCalled()
    })
  })
})
