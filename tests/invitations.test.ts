import { createHash } from "node:crypto"
import { beforeEach, describe, expect, it } from "vitest"
import { prisma } from "@/app/_lib/prisma"
import {
  INVITATION_TTL_DAYS,
  createInvitation,
  generateInvitationToken,
  getInvitationExpiry,
  hashInvitationToken,
  isInvitationExpired,
} from "@/app/_lib/invitation"
import { acceptInvitation } from "@/app/_actions/accept-invitation"
import { createAtendente } from "@/app/_actions/create-atendente"
import { getInvitationByToken } from "@/app/_data/get-invitation-by-token"
import {
  createEmployee as createEmployeeRow,
  createMembership,
  createShop,
  createUser,
} from "./helpers/factories"
import {
  failNextEmail,
  getLastInvitationToken,
  getSentEmails,
} from "./helpers/email"
import { mockSession } from "./helpers/session"

const DAY_MS = 24 * 60 * 60 * 1000

describe("invitation tokens", () => {
  it("are 32 random bytes in base64url, hashed with sha256", () => {
    const { token, tokenHash } = generateInvitationToken()

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(Buffer.from(token, "base64url")).toHaveLength(32)
    expect(tokenHash).toBe(createHash("sha256").update(token).digest("hex"))
    expect(hashInvitationToken(token)).toBe(tokenHash)
    expect(generateInvitationToken().token).not.toBe(token)
  })

  it("expire after 7 days", () => {
    const now = new Date("2030-01-01T12:00:00.000Z")
    const expiresAt = getInvitationExpiry(now)

    expect(INVITATION_TTL_DAYS).toBe(7)
    expect(expiresAt.getTime() - now.getTime()).toBe(7 * DAY_MS)
    expect(
      isInvitationExpired({ expiresAt }, new Date(expiresAt.getTime() - 1)),
    ).toBe(false)
    expect(isInvitationExpired({ expiresAt }, expiresAt)).toBe(true)
  })
})

describe("createInvitation", () => {
  it("stores only the hash and emails the link", async () => {
    const shop = await createShop({ name: "Barbearia <Teste>" })

    const sent = await createInvitation({
      shop,
      email: " Novo@Test.Local ",
      role: "EMPLOYEE",
      invitedById: null,
    })

    expect(sent).toBe(true)
    const token = getLastInvitationToken()
    const invitation = await prisma.invitation.findFirstOrThrow()

    expect(invitation.email).toBe("novo@test.local")
    expect(invitation.tokenHash).toBe(hashInvitationToken(token))
    expect(JSON.stringify(invitation)).not.toContain(token)
    expect(invitation.expiresAt.getTime() - Date.now()).toBeGreaterThan(
      7 * DAY_MS - 60_000,
    )

    const [email] = getSentEmails()
    expect(email.to).toBe("novo@test.local")
    expect(email.html).toContain(`/convite/${token}`)
    // Shop names are escaped in the HTML body
    expect(email.html).toContain("Barbearia &lt;Teste&gt;")
  })

  it("re-inviting the same email replaces the pending invitation", async () => {
    const shop = await createShop()
    const input = {
      shop,
      email: "novo@test.local",
      role: "ATENDENTE" as const,
      invitedById: null,
    }

    await createInvitation(input)
    const oldToken = getLastInvitationToken()
    await createInvitation({ ...input, email: "NOVO@test.local" })
    const newToken = getLastInvitationToken()

    expect(await prisma.invitation.count()).toBe(1)
    expect(await getInvitationByToken(oldToken)).toBeNull()
    expect(await getInvitationByToken(newToken)).not.toBeNull()
  })

  it("keeps invitations of the same email to other shops", async () => {
    const shopA = await createShop()
    const shopB = await createShop()

    for (const shop of [shopA, shopB]) {
      await createInvitation({
        shop,
        email: "novo@test.local",
        role: "EMPLOYEE",
        invitedById: null,
      })
    }

    expect(await prisma.invitation.count()).toBe(2)
  })

  it("removes the invitation when the email fails", async () => {
    const shop = await createShop()
    failNextEmail()

    const sent = await createInvitation({
      shop,
      email: "novo@test.local",
      role: "EMPLOYEE",
      invitedById: null,
    })

    expect(sent).toBe(false)
    expect(await prisma.invitation.count()).toBe(0)
  })
})

describe("acceptInvitation", () => {
  let shopA: Awaited<ReturnType<typeof createShop>>
  let shopB: Awaited<ReturnType<typeof createShop>>

  const invite = async (
    email: string,
    role: "ADMIN" | "ATENDENTE" | "EMPLOYEE",
    shop = shopA,
  ) => {
    await createInvitation({ shop, email, role, invitedById: null })
    return getLastInvitationToken()
  }

  beforeEach(async () => {
    shopA = await createShop({ slug: "barbearia-a" })
    shopB = await createShop({ slug: "barbearia-b" })
  })

  it("creates the membership and the Employee row of a barber", async () => {
    const user = await createUser({ email: "novo@test.local" })
    const token = await invite("novo@test.local", "EMPLOYEE")
    mockSession(user.id)

    const result = await acceptInvitation(token)

    expect(result).toEqual({
      path: "/b/barbearia-a/staff",
      alreadyMember: false,
    })
    expect(
      await prisma.membership.findMany({ where: { userId: user.id } }),
    ).toMatchObject([{ barbershopId: shopA.id, role: "EMPLOYEE" }])
    expect(
      await prisma.employee.findMany({ where: { userId: user.id } }),
    ).toMatchObject([{ barbershopId: shopA.id, isActive: true }])
    const invitation = await prisma.invitation.findFirstOrThrow()
    expect(invitation.acceptedAt).not.toBeNull()
  })

  it("opens the admin area for an ADMIN invitation, without an Employee row", async () => {
    const user = await createUser({ email: "dono@test.local" })
    const token = await invite("dono@test.local", "ADMIN")
    mockSession(user.id)

    const result = await acceptInvitation(token)

    expect(result.path).toBe("/b/barbearia-a/admin")
    expect(await prisma.employee.count({ where: { userId: user.id } })).toBe(0)
  })

  it("matches the email case-insensitively", async () => {
    const user = await createUser({ email: "Novo@Test.local" })
    const token = await invite("novo@test.local", "ATENDENTE")
    mockSession(user.id)

    const result = await acceptInvitation(token)

    expect(result.path).toBe("/b/barbearia-a/atendente")
  })

  it("rejects a signed-in user with another email", async () => {
    await createUser({ email: "novo@test.local" })
    const other = await createUser({ email: "outro@test.local" })
    const token = await invite("novo@test.local", "ADMIN")
    mockSession(other.id)

    await expect(acceptInvitation(token)).rejects.toThrow(
      "Este convite foi enviado para novo@test.local.",
    )
    expect(await prisma.membership.count()).toBe(0)
    expect((await prisma.invitation.findFirstOrThrow()).acceptedAt).toBeNull()
  })

  it("rejects a signed-out user", async () => {
    const token = await invite("novo@test.local", "ADMIN")

    await expect(acceptInvitation(token)).rejects.toThrow(
      "Você precisa estar logado.",
    )
  })

  it("rejects an expired invitation", async () => {
    const user = await createUser({ email: "novo@test.local" })
    const token = await invite("novo@test.local", "EMPLOYEE")
    await prisma.invitation.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    })
    mockSession(user.id)

    await expect(acceptInvitation(token)).rejects.toThrow(
      "Este convite expirou. Peça um novo convite.",
    )
    expect(await prisma.membership.count()).toBe(0)
    expect(await prisma.employee.count()).toBe(0)
  })

  it("cannot be used twice", async () => {
    const user = await createUser({ email: "novo@test.local" })
    const token = await invite("novo@test.local", "EMPLOYEE")
    mockSession(user.id)

    await acceptInvitation(token)
    // Removed from the team afterwards: the old link must not bring them back
    await prisma.membership.deleteMany({ where: { userId: user.id } })

    await expect(acceptInvitation(token)).rejects.toThrow(
      "Este convite já foi usado.",
    )
    expect(await prisma.membership.count({ where: { userId: user.id } })).toBe(
      0,
    )
  })

  it("rejects an unknown token", async () => {
    const user = await createUser({ email: "novo@test.local" })
    mockSession(user.id)

    await expect(
      acceptInvitation(generateInvitationToken().token),
    ).rejects.toThrow("Convite inválido.")
    await expect(acceptInvitation("")).rejects.toThrow("Convite inválido.")
  })

  it("rejects an invitation of a suspended shop", async () => {
    const user = await createUser({ email: "novo@test.local" })
    const token = await invite("novo@test.local", "ADMIN")
    await prisma.barbershop.update({
      where: { id: shopA.id },
      data: { status: "SUSPENDED" },
    })
    mockSession(user.id)

    await expect(acceptInvitation(token)).rejects.toThrow(
      "Barbearia não encontrada.",
    )
    expect(await prisma.membership.count()).toBe(0)
  })

  it("only grants a role in the shop that sent the invitation", async () => {
    const user = await createUser({ email: "novo@test.local" })
    const tokenB = await invite("novo@test.local", "ADMIN", shopB)
    mockSession(user.id)

    const result = await acceptInvitation(tokenB)

    expect(result.path).toBe("/b/barbearia-b/admin")
    expect(
      await prisma.membership.findMany({ where: { userId: user.id } }),
    ).toMatchObject([{ barbershopId: shopB.id, role: "ADMIN" }])
  })

  it("lets an admin invite only into their own shop", async () => {
    const adminA = await createUser()
    await createMembership(adminA.id, shopA.id, "ADMIN")
    await createUser({ email: "novo@test.local" })
    mockSession(adminA.id)

    await expect(
      createAtendente("barbearia-b", { email: "novo@test.local" }),
    ).rejects.toThrow("Sem permissão.")
    expect(await prisma.invitation.count()).toBe(0)
  })

  it("handles a user who is already a member", async () => {
    const user = await createUser({ email: "novo@test.local" })
    await createMembership(user.id, shopA.id, "ATENDENTE")
    const token = await invite("novo@test.local", "ADMIN")
    mockSession(user.id)

    const result = await acceptInvitation(token)

    expect(result).toEqual({
      path: "/b/barbearia-a/atendente",
      alreadyMember: true,
    })
    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
    })
    expect(memberships).toMatchObject([{ role: "ATENDENTE" }])
    expect(
      (await prisma.invitation.findFirstOrThrow()).acceptedAt,
    ).not.toBeNull()
  })

  it("gives an ADMIN invited as barber the Employee row and keeps ADMIN", async () => {
    const user = await createUser({ email: "dono@test.local" })
    await createMembership(user.id, shopA.id, "ADMIN")
    const token = await invite("dono@test.local", "EMPLOYEE")
    mockSession(user.id)

    const result = await acceptInvitation(token)

    expect(result).toEqual({
      path: "/b/barbearia-a/admin",
      alreadyMember: false,
    })
    expect(
      await prisma.employee.count({
        where: { userId: user.id, barbershopId: shopA.id },
      }),
    ).toBe(1)
  })

  it("reactivates a barber removed earlier", async () => {
    const user = await createUser({ email: "barbeiro@test.local" })
    const employee = await createEmployeeRow(user.id, shopA.id)
    await prisma.employee.update({
      where: { id: employee.id },
      data: { isActive: false },
    })
    await prisma.membership.deleteMany({ where: { userId: user.id } })
    const token = await invite("barbeiro@test.local", "EMPLOYEE")
    mockSession(user.id)

    await acceptInvitation(token)

    expect(
      (await prisma.employee.findUniqueOrThrow({ where: { id: employee.id } }))
        .isActive,
    ).toBe(true)
    expect(await prisma.employee.count({ where: { userId: user.id } })).toBe(1)
  })
})
