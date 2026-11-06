import { describe, expect, it, vi } from "vitest"
import { headers } from "next/headers"
import { prisma } from "@/app/_lib/prisma"
import { signUp } from "@/app/_actions/sign-up"
import { requestPasswordReset } from "@/app/_actions/request-password-reset"
import { verifyResetCode } from "@/app/_actions/verify-reset-code"
import { assertRateLimit } from "@/app/_lib/rate-limit"
import { unwrap } from "@/app/_lib/action-result"
import nextConfig from "@/next.config"
import { createShop, createUser } from "./helpers/factories"
import { createInvitation, findUserByEmail } from "@/app/_lib/invitation"
import { findAccountByEmail } from "@/app/_lib/email-match"
import { sendEmailMock } from "./helpers/email"

const STRONG = "Senha@Forte123"
const WINDOW = { limit: 2, windowMs: 60 * 60 * 1000 }
const LIMITED = "Muitas tentativas. Tente novamente mais tarde."

const fromIp = (ip: string) =>
  vi
    .mocked(headers)
    .mockResolvedValue(new Headers({ "x-real-ip": ip }) as never)

describe("assertRateLimit", () => {
  it("allows up to the limit, then refuses", async () => {
    await assertRateLimit("test", "a", WINDOW)
    await assertRateLimit("test", "a", WINDOW)

    await expect(assertRateLimit("test", "a", WINDOW)).rejects.toThrow(LIMITED)
  })

  it("keeps separate counters per id and per scope", async () => {
    await assertRateLimit("test", "a", { ...WINDOW, limit: 1 })

    await expect(
      assertRateLimit("test", "b", { ...WINDOW, limit: 1 }),
    ).resolves.toBeUndefined()
    await expect(
      assertRateLimit("other", "a", { ...WINDOW, limit: 1 }),
    ).resolves.toBeUndefined()
  })

  it("counts parallel attempts exactly", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () => assertRateLimit("test", "a", WINDOW)),
    )

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2)
  })

  it("starts over when the window ends and sweeps old rows", async () => {
    await assertRateLimit("test", "a", WINDOW)
    await assertRateLimit("test", "b", WINDOW)
    await prisma.rateLimit.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000), count: 99 },
    })

    await expect(assertRateLimit("test", "a", WINDOW)).resolves.toBeUndefined()

    expect(await prisma.rateLimit.findMany()).toMatchObject([{ count: 1 }])
  })

  it("stores no readable IP or email", async () => {
    await assertRateLimit("test", "cliente@test.local", WINDOW)

    const [row] = await prisma.rateLimit.findMany()
    expect(row.key).not.toContain("cliente")
  })
})

describe("rate limited actions", () => {
  it("limits sign-ups per IP, without creating accounts", async () => {
    fromIp("203.0.113.10")
    const attempt = (n: number) =>
      unwrap(
        signUp({
          name: "Conta Nova",
          email: `novo${n}@test.local`,
          password: STRONG,
          acceptTerms: true,
        }),
      )

    for (let n = 0; n < 10; n++) await attempt(n)

    await expect(attempt(10)).rejects.toThrow(LIMITED)
    expect(await prisma.user.count()).toBe(10)

    fromIp("203.0.113.11")
    await expect(attempt(11)).resolves.toBeUndefined()
  })

  it("silently stops reset emails per address, known or not", async () => {
    await createUser({ email: "alvo@test.local" })
    const request = (email: string) => unwrap(requestPasswordReset({ email }))

    for (let n = 0; n < 3; n++) {
      fromIp(`203.0.113.${n}`)
      await request("alvo@test.local")
      await request("ninguem@test.local")
    }

    fromIp("203.0.113.50")
    await expect(request("alvo@test.local")).resolves.toBeUndefined()
    await expect(request("ninguem@test.local")).resolves.toBeUndefined()
    expect(sendEmailMock()).toHaveBeenCalledTimes(3)
    // The last code the owner got still works
    expect(
      await prisma.passwordResetCode.count({ where: { usedAt: null } }),
    ).toBe(1)
  })

  it("does not spend an address's quota once the IP is over its limit", async () => {
    await createUser({ email: "alvo@test.local" })
    fromIp("203.0.113.30")
    for (let n = 0; n < 10; n++) {
      await unwrap(requestPasswordReset({ email: `b${n}@test.local` }))
    }

    for (let n = 0; n < 5; n++) {
      await expect(
        unwrap(requestPasswordReset({ email: "alvo@test.local" })),
      ).rejects.toThrow(LIMITED)
    }

    fromIp("203.0.113.31")
    await unwrap(requestPasswordReset({ email: "alvo@test.local" }))
    expect(sendEmailMock()).toHaveBeenCalledTimes(1)
  })

  it("limits code guesses per IP", async () => {
    fromIp("203.0.113.40")
    const guess = () =>
      unwrap(verifyResetCode({ email: "x@test.local", code: "123456" }))

    for (let n = 0; n < 20; n++) {
      await expect(guess()).rejects.toThrow("Código inválido.")
    }

    await expect(guess()).rejects.toThrow(LIMITED)
  })

  it("limits reset requests per IP across addresses", async () => {
    fromIp("203.0.113.20")

    for (let n = 0; n < 10; n++) {
      await unwrap(requestPasswordReset({ email: `a${n}@test.local` }))
    }

    await expect(
      unwrap(requestPasswordReset({ email: "a10@test.local" })),
    ).rejects.toThrow(LIMITED)
  })
})

describe("email matching", () => {
  it("ignores case but treats _ and % literally", async () => {
    const user = await createUser({ email: "axb@test.local" })

    expect(await findUserByEmail("AXB@test.local")).toEqual({ id: user.id })
    expect(await findUserByEmail("a_b@test.local")).toBeNull()
    expect(await findUserByEmail("a%@test.local")).toBeNull()
    expect(await findAccountByEmail("a_b@test.local")).toBeNull()
  })

  it("still finds an email that really has an underscore", async () => {
    const user = await createUser({ email: "a_b@test.local" })

    expect(await findUserByEmail("A_B@test.local")).toEqual({ id: user.id })
  })

  it("prefers the exact match between accounts that differ by case", async () => {
    await createUser({ email: "Dono@test.local" })
    const exact = await createUser({ email: "dono@test.local" })

    expect((await findAccountByEmail("dono@test.local"))?.id).toBe(exact.id)
  })
})

describe("expired invitation purge", () => {
  it("removes only this shop's expired pending invitations", async () => {
    const shopA = await createShop({ slug: "barbearia-a" })
    const shopB = await createShop({ slug: "barbearia-b" })
    const PAST = new Date(Date.now() - 1000)
    const invite = (
      tokenHash: string,
      barbershopId: string,
      acceptedAt: Date | null,
    ) =>
      prisma.invitation.create({
        data: {
          tokenHash,
          barbershopId,
          acceptedAt,
          email: `${tokenHash}@test.local`,
          role: "EMPLOYEE",
          expiresAt: PAST,
        },
      })
    await invite("expired-a", shopA.id, null)
    await invite("accepted-a", shopA.id, new Date())
    await invite("expired-b", shopB.id, null)

    await createInvitation({
      shop: shopA,
      email: "novo@test.local",
      role: "EMPLOYEE",
      invitedById: null,
    })

    const left = await prisma.invitation.findMany({
      select: { tokenHash: true },
    })
    const hashes = left.map(({ tokenHash }) => tokenHash)
    expect(hashes).not.toContain("expired-a")
    expect(hashes).toEqual(expect.arrayContaining(["accepted-a", "expired-b"]))
  })
})

describe("security headers", () => {
  it("apply to every route", async () => {
    const [rule] = await nextConfig.headers!()
    const sent = Object.fromEntries(
      rule.headers.map(({ key, value }) => [key, value]),
    )

    expect(rule.source).toBe("/:path*")
    expect(sent).toMatchObject({
      "Strict-Transport-Security": expect.stringContaining("max-age="),
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    })
    expect(sent["Content-Security-Policy"]).toContain("frame-ancestors 'none'")
  })
})
