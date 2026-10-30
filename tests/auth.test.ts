import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import type { JWT } from "next-auth/jwt"
import { proxy } from "@/proxy"
import { authOptions } from "@/app/_lib/auth"
import { getSafeCallbackUrl } from "@/app/_lib/safe-callback-url"
import { isProtectedPath } from "@/app/_lib/protected-paths"
import {
  getStaffLandingPath,
  resolvePostLoginPath,
} from "@/app/_lib/staff-shop"
import { getPostLoginPath } from "@/app/_actions/get-post-login-path"
import { getHasStaffMembership } from "@/app/_actions/get-has-staff-membership"
import { getUserMemberships } from "@/app/_data/get-user-memberships"
import LegacyAdminLoginPage from "@/app/admin/login/page"
import { createMembership, createShop, createUser } from "./helpers/factories"
import { mockSession } from "./helpers/session"

vi.mock("next-auth/jwt", () => ({ getToken: vi.fn() }))

const request = (path: string) =>
  new NextRequest(new URL(path, "http://localhost:3000"))

const signedInToken = { id: "user-1", sub: "user-1" } as unknown as JWT

describe("proxy", () => {
  beforeEach(() => {
    vi.mocked(getToken).mockResolvedValue(null)
  })

  it.each([
    "/painel",
    "/bookings",
    "/profile",
    "/b/barbearia-a/admin",
    "/b/barbearia-a/admin/services",
    "/b/barbearia-a/atendente/bookings",
    "/b/barbearia-a/staff",
    "/admin",
    "/admin/bookings",
    "/admin/atendente",
  ])("sends a signed-out user from %s to /login", async (path) => {
    const response = await proxy(request(`${path}?page=2`))

    expect(response.status).toBe(307)
    const location = new URL(response.headers.get("location")!)
    expect(location.pathname).toBe("/login")
    expect(location.searchParams.get("callbackUrl")).toBe(`${path}?page=2`)
  })

  it.each([
    "/",
    "/b/barbearia-a",
    "/b/barbearia-a/services/abc",
    "/b/barbearia-a/employees/abc",
    "/b/admin",
    "/login",
    "/admin/login",
    "/privacy-policy",
  ])("lets anyone open the public page %s", async (path) => {
    const response = await proxy(request(path))

    expect(response.headers.get("location")).toBeNull()
    expect(response.headers.get("x-middleware-next")).toBe("1")
  })

  it("lets a signed-in user through without reading any role", async () => {
    vi.mocked(getToken).mockResolvedValue(signedInToken)

    const response = await proxy(request("/b/barbearia-a/admin"))

    expect(response.headers.get("location")).toBeNull()
    expect(response.headers.get("x-middleware-next")).toBe("1")
  })

  it("does not read the token on public pages", async () => {
    await proxy(request("/b/barbearia-a"))

    expect(getToken).not.toHaveBeenCalled()
  })

  it("matches only whole path segments", () => {
    expect(isProtectedPath("/painelx")).toBe(false)
    expect(isProtectedPath("/b/x/administrador")).toBe(false)
    expect(isProtectedPath("/b/x/y/admin")).toBe(false)
    expect(isProtectedPath("/admin/loginx")).toBe(true)
  })
})

describe("getSafeCallbackUrl", () => {
  it.each([
    ["/b/barbearia-a/admin", "/b/barbearia-a/admin"],
    ["/b/barbearia-a/admin?page=2#x", "/b/barbearia-a/admin?page=2#x"],
    ["/painel", "/painel"],
    ["/", "/"],
  ])("accepts %s", (value, expected) => {
    expect(getSafeCallbackUrl(value)).toBe(expected)
  })

  it.each([
    "//evil.com",
    "//evil.com/b/x",
    "https://evil.com",
    "http://localhost:3000/painel",
    "/\\evil.com",
    "/b/\\evil",
    "/\t/evil.com",
    "/\n/evil.com",
    "javascript:alert(1)",
    "evil.com",
    "",
    "/login",
    "/login?callbackUrl=%2Fpainel",
    "/.//evil.com",
    "/x/..//evil.com",
    "/%2e//evil.com",
    "/LOGIN",
    "/%6Cogin",
    "/%E0%A4%A",
  ])("rejects %j", (value) => {
    expect(getSafeCallbackUrl(value)).toBeNull()
  })

  it("rejects anything that is not a string", () => {
    expect(getSafeCallbackUrl(undefined)).toBeNull()
    expect(getSafeCallbackUrl(["/painel"])).toBeNull()
    expect(getSafeCallbackUrl(42)).toBeNull()
  })
})

describe("post-login landing", () => {
  it("lands a single-shop member in their area and a multi-shop one on /painel", async () => {
    const shopA = await createShop({ slug: "barbearia-a" })
    const shopB = await createShop({ slug: "barbearia-b" })
    const owner = await createUser()
    const multi = await createUser()
    const client = await createUser()
    await createMembership(owner.id, shopA.id, "ADMIN")
    await createMembership(multi.id, shopA.id, "EMPLOYEE")
    await createMembership(multi.id, shopB.id, "ATENDENTE")

    expect(await getStaffLandingPath(owner.id)).toBe("/b/barbearia-a/admin")
    expect(await getStaffLandingPath(multi.id)).toBe("/painel")
    expect(await getStaffLandingPath(client.id)).toBeNull()

    expect(await resolvePostLoginPath(client.id)).toBe("/")
    expect(await resolvePostLoginPath(owner.id, "/bookings")).toBe("/bookings")
    expect(await resolvePostLoginPath(owner.id, "//evil.com")).toBe(
      "/b/barbearia-a/admin",
    )
    expect(await resolvePostLoginPath(client.id, "https://evil.com")).toBe("/")
  })

  it("ignores memberships in suspended shops", async () => {
    const active = await createShop({ slug: "ativa" })
    const suspended = await createShop({
      slug: "suspensa",
      status: "SUSPENDED",
    })
    const user = await createUser()
    await createMembership(user.id, active.id, "EMPLOYEE")
    await createMembership(user.id, suspended.id, "ADMIN")

    expect(await getStaffLandingPath(user.id)).toBe("/b/ativa/staff")
  })

  it("re-checks the callbackUrl in the action", async () => {
    const shop = await createShop({ slug: "barbearia-a" })
    const user = await createUser()
    await createMembership(user.id, shop.id, "ATENDENTE")

    expect(await getPostLoginPath("/painel")).toBe("/login")

    mockSession(user.id)
    expect(await getPostLoginPath("/\\evil.com")).toBe(
      "/b/barbearia-a/atendente",
    )
    expect(await getPostLoginPath("/b/barbearia-a/atendente/bookings")).toBe(
      "/b/barbearia-a/atendente/bookings",
    )
  })
})

describe("legacy /admin/login", () => {
  it("forwards to /login with a safe callbackUrl only", async () => {
    await expect(
      LegacyAdminLoginPage({
        searchParams: Promise.resolve({ callbackUrl: "/b/x/admin" }),
      } as never),
    ).rejects.toMatchObject({ url: "/login?callbackUrl=%2Fb%2Fx%2Fadmin" })

    await expect(
      LegacyAdminLoginPage({
        searchParams: Promise.resolve({ callbackUrl: "//evil.com" }),
      } as never),
    ).rejects.toMatchObject({ url: "/login" })
  })
})

describe("/painel memberships", () => {
  it("lists only the user's own memberships in active shops", async () => {
    const shopA = await createShop({ slug: "barbearia-a", name: "A" })
    const shopB = await createShop({ slug: "barbearia-b", name: "B" })
    const suspended = await createShop({
      slug: "suspensa",
      status: "SUSPENDED",
    })
    const user = await createUser()
    const other = await createUser()
    await createMembership(user.id, shopB.id, "ADMIN")
    await createMembership(user.id, shopA.id, "EMPLOYEE")
    await createMembership(user.id, suspended.id, "ADMIN")
    await createMembership(other.id, shopA.id, "ATENDENTE")

    const memberships = await getUserMemberships(user.id)

    expect(
      memberships.map((membership) => [
        membership.barbershop.slug,
        membership.role,
      ]),
    ).toEqual([
      ["barbearia-a", "EMPLOYEE"],
      ["barbearia-b", "ADMIN"],
    ])
  })

  it("tells the headers whether to show the link", async () => {
    const shop = await createShop()
    const staff = await createUser()
    const client = await createUser()
    await createMembership(staff.id, shop.id, "EMPLOYEE")

    expect(await getHasStaffMembership()).toBe(false)

    mockSession(client.id)
    expect(await getHasStaffMembership()).toBe(false)

    mockSession(staff.id)
    expect(await getHasStaffMembership()).toBe(true)
  })
})

describe("JWT", () => {
  it("carries only the user id and drops a legacy role", async () => {
    const token = await authOptions.callbacks!.jwt!({
      token: { sub: "user-1", role: "ADMIN" } as JWT,
      user: { id: "user-1" } as never,
      account: null,
    } as never)

    expect(token).toEqual({ sub: "user-1", id: "user-1" })
  })

  it("puts only the id on the session user", async () => {
    const session = await authOptions.callbacks!.session!({
      session: {
        user: { name: "Ana", email: "ana@test.local" },
        expires: "",
      },
      token: { id: "user-1", role: "ADMIN" } as JWT,
    } as never)

    expect(session.user).toEqual({
      name: "Ana",
      email: "ana@test.local",
      id: "user-1",
    })
  })
})
