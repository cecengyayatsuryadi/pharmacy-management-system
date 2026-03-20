import { describe, it, expect, vi, beforeEach } from "vitest"
import { getMedicines, createMedicineAction, updateMedicineAction, deleteMedicineAction } from "./medicine"
import { auth } from "@/auth"
import { db } from "@workspace/database"
import { revalidatePath } from "next/cache"
import { getOrganizationPlan } from "@/lib/organization-plan"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@workspace/database", () => ({
  db: {
    query: {
      medicines: {
        findMany: vi.fn(),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ value: 0 }])),
      })),
    })),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn((cb) => cb(db)),
  },
  medicines: {
    organizationId: "organizationId",
    id: "id",
    createdAt: "createdAt",
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/organization-plan", () => ({
  getOrganizationPlan: vi.fn(),
}))

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  count: vi.fn(),
  ilike: vi.fn(),
  or: vi.fn(),
  desc: vi.fn(),
}))

describe("Medicine Actions", () => {
  const mockOrgId = "org-123"
  const mockSession = { user: { id: "user-1", organizationId: mockOrgId, role: "admin" } }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockImplementation(async () => mockSession as any)
  })

  describe("getMedicines", () => {
    it("should return medicines list and metadata", async () => {
      const mockData = [{ id: "med-1", name: "Paracetamol" }]
      vi.mocked(db.query.medicines.findMany).mockResolvedValue(mockData as any)
      // countResult mock is handled by global mock above

      const result = await getMedicines(1, 10, "para")

      expect(result.data).toEqual(mockData)
      expect(result.metadata.total).toBe(0) // from mock
      expect(db.query.medicines.findMany).toHaveBeenCalled()
    })

    it("should return empty list on error", async () => {
      vi.mocked(db.query.medicines.findMany).mockRejectedValue(new Error("DB Error"))
      
      const result = await getMedicines()
      
      expect(result.data).toEqual([])
      expect(result.metadata.total).toBe(0)
    })
  })

  describe("createMedicineAction", () => {
    const validFormData = () => {
      const fd = new FormData()
      fd.append("name", "Amoxicillin")
      fd.append("categoryId", "00000000-0000-0000-0000-000000000001")
      fd.append("baseUnitId", "00000000-0000-0000-0000-000000000002")
      fd.append("purchasePrice", "500")
      fd.append("price", "1000")
      fd.append("stock", "100")
      fd.append("minStock", "10")
      fd.append("maxStock", "500")
      return fd
    }

    it("should return validation errors for invalid input", async () => {
      const fd = new FormData() // Empty
      const result = await createMedicineAction(null, fd)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it("should fail if plan limit is reached", async () => {
      vi.mocked(getOrganizationPlan).mockResolvedValue("gratis")
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 100 }])
        })
      } as any)

      const result = await createMedicineAction(null, validFormData())

      expect(result.success).toBe(false)
      expect(result.message).toContain("Limit tercapai")
    })

    it("should succeed and revalidate path", async () => {
      vi.mocked(getOrganizationPlan).mockResolvedValue("pro")
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue({})
      } as any)

      const result = await createMedicineAction(null, validFormData())

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard/inventory/master/medicines")
    })
  })

  describe("updateMedicineAction", () => {
    it("should successfully update and return success", async () => {
      const fd = new FormData()
      fd.append("name", "Updated Name")
      fd.append("categoryId", "00000000-0000-0000-0000-000000000001")
      fd.append("baseUnitId", "00000000-0000-0000-0000-000000000002")
      fd.append("purchasePrice", "600")
      fd.append("price", "1200")
      fd.append("stock", "100")
      fd.append("minStock", "10")
      fd.append("maxStock", "500")

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: "med-1" }])
          })
        })
      } as any)

      const result = await updateMedicineAction("med-1", null, fd)

      expect(result.success).toBe(true)
      expect(db.update).toHaveBeenCalled()
    })

    it("should return error if record not found", async () => {
      const fd = new FormData()
      fd.append("name", "Name")
      fd.append("categoryId", "00000000-0000-0000-0000-000000000001")
      fd.append("baseUnitId", "00000000-0000-0000-0000-000000000002")
      fd.append("purchasePrice", "600")
      fd.append("price", "1200")
      fd.append("stock", "100")
      fd.append("minStock", "10")
      fd.append("maxStock", "500")

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]) // Empty array
          })
        })
      } as any)

      const result = await updateMedicineAction("non-existent", null, fd)

      expect(result.success).toBe(false)
      expect(result.message).toContain("tidak ditemukan")
    })
  })

  describe("deleteMedicineAction", () => {
    it("should restrict deletion to admin only", async () => {
      vi.mocked(auth).mockImplementation(async () => ({ 
        user: { id: "user-staff", organizationId: "org-1", role: "staff" } 
      } as any))
      
      const result = await deleteMedicineAction("med-1")
      
      expect(result.success).toBe(false)
      expect(result.message).toContain("Hanya Admin")
    })

    it("should successfully delete and revalidate", async () => {
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "med-1" }])
        })
      } as any)

      const result = await deleteMedicineAction("med-1")

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalled()
    })
  })
})
