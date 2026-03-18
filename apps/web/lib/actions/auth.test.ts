import { beforeEach, describe, expect, it, vi } from "vitest"
import bcrypt from "bcryptjs"
import { signupAction } from "./auth"
import { signIn } from "@/auth"
import { db } from "@workspace/database"

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
}))

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
  },
}))

vi.mock("next/dist/client/components/redirect-error", () => ({
  isRedirectError: vi.fn(() => false),
}))

vi.mock("next-auth", () => ({
  AuthError: class MockAuthError extends Error {
    type: string
    constructor(type = "CredentialsSignin") {
      super(type)
      this.type = type
    }
  },
}))

vi.mock("@workspace/database", () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    transaction: vi.fn(),
  },
  users: {
    email: "email",
  },
  organizations: {},
  memberships: {},
}))

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}))

describe("signupAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return validation errors for invalid input", async () => {
    const formData = new FormData()
    formData.append("name", "A")
    formData.append("email", "invalid-email")
    formData.append("password", "123")
    formData.append("organizationName", "AB")

    const result = await signupAction(null, formData)

    expect(result).toMatchObject({
      errors: expect.any(Object),
      message: "Gagal mendaftar. Mohon periksa input Anda.",
    })
  })

  it("should return message when email is already registered", async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: "user-1" } as any)

    const formData = new FormData()
    formData.append("name", "John Doe")
    formData.append("email", "john@example.com")
    formData.append("password", "secret123")
    formData.append("organizationName", "Apotek Maju")

    const result = await signupAction(null, formData)

    expect(result).toEqual({ message: "Email sudah terdaftar. Silakan gunakan email lain." })
    expect(signIn).not.toHaveBeenCalled()
  })

  it("should create organization/user and sign in on successful signup", async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined)
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never)

    const mockTx = {
      insert: vi.fn(),
    }
    const orgInsertChain = {
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "org-1" }]),
      }),
    }
    const userInsertChain = {
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "user-1" }]),
      }),
    }
    const membershipInsertChain = {
      values: vi.fn().mockResolvedValue({}),
    }

    mockTx.insert
      .mockReturnValueOnce(orgInsertChain)
      .mockReturnValueOnce(userInsertChain)
      .mockReturnValueOnce(membershipInsertChain)

    vi.mocked(db.transaction).mockImplementation(async (cb: any) => cb(mockTx))

    const formData = new FormData()
    formData.append("name", "John Doe")
    formData.append("email", "john@example.com")
    formData.append("password", "secret123")
    formData.append("organizationName", "Apotek Maju")

    const result = await signupAction(null, formData)

    expect(result).toEqual({ message: "Pendaftaran berhasil! Mengalihkan..." })
    expect(db.transaction).toHaveBeenCalled()
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "john@example.com",
      password: "secret123",
      redirectTo: "/dashboard",
    })
  })

  it("should return database connection message when ECONNREFUSED happens", async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined)
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never)
    vi.mocked(db.transaction).mockRejectedValue({ code: "ECONNREFUSED" } as any)

    const formData = new FormData()
    formData.append("name", "John Doe")
    formData.append("email", "john@example.com")
    formData.append("password", "secret123")
    formData.append("organizationName", "Apotek Maju")

    const result = await signupAction(null, formData)

    expect(result).toEqual({
      message: "Koneksi ke database gagal. Pastikan Docker sudah jalan.",
    })
  })
})
