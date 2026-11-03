import { beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "@/app/_lib/prisma"
import { assertPlanLimit, getPlanLimit } from "@/app/_lib/plan-limits"
import { createEmployee } from "@/app/_actions/create-employee"
import { createAtendente } from "@/app/_actions/create-atendente"
import { getInvitationExpiry } from "@/app/_lib/invitation"
import { unwrap } from "@/app/_lib/action-result"
import {
  createEmployee as createEmployeeRow,
  createMembership,
  createShop,
  createUser,
} from "./helpers/factories"
import { mockSession } from "./helpers/session"

// A fake limited plan: today's only plan is unlimited, so the hook is proven
// by swapping the BASIC limits in the PLANS config (mutable per test)
const limits = vi.hoisted(() => ({
  maxEmployees: null as number | null,
  maxAtendentes: null as number | null,
}))

vi.mock("@/app/_lib/plans", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/app/_lib/plans")>()
  return {
    ...actual,
    PLANS: { BASIC: { ...actual.PLANS.BASIC, limits } },
  }
})

const EMPLOYEE_LIMIT = "O plano da barbearia permite até 2 funcionários."
const ATENDENTE_LIMIT = "O plano da barbearia permite até 1 atendente."

let shop: Awaited<ReturnType<typeof createShop>>
let otherShop: Awaited<ReturnType<typeof createShop>>
let admin: Awaited<ReturnType<typeof createUser>>

const newBarber = (n: number) => ({
  name: `Barbeiro ${n}`,
  email: `barbeiro${n}@test.local`,
  password: "Senha12345!",
})

const newAtendente = (n: number) => ({
  name: `Atendente ${n}`,
  email: `atendente${n}@test.local`,
  password: "Senha12345!",
})

const pendingInvitation = (
  barbershopId: string,
  email: string,
  role: "EMPLOYEE" | "ATENDENTE",
  overrides: { expiresAt?: Date; acceptedAt?: Date } = {},
) =>
  prisma.invitation.create({
    data: {
      barbershopId,
      email,
      role,
      tokenHash: `hash-${email}-${role}-${Math.random()}`,
      expiresAt: overrides.expiresAt ?? getInvitationExpiry(),
      acceptedAt: overrides.acceptedAt ?? null,
    },
  })

beforeEach(async () => {
  limits.maxEmployees = 2
  limits.maxAtendentes = 1
  shop = await createShop({ slug: "barbearia-a" })
  otherShop = await createShop({ slug: "barbearia-b" })
  admin = await createUser({ name: "Admin" })
  await createMembership(admin.id, shop.id, "ADMIN")
  mockSession(admin.id)
})

describe("getPlanLimit", () => {
  it("reads the limits from the PLANS config", () => {
    expect(getPlanLimit("BASIC", "employees")).toBe(2)
    expect(getPlanLimit("BASIC", "atendentes")).toBe(1)
  })

  it("falls back to the default plan for a plan missing from PLANS", () => {
    expect(getPlanLimit("TRIAL", "employees")).toBe(2)
    expect(getPlanLimit("PRO", "atendentes")).toBe(1)
  })
})

describe("assertPlanLimit", () => {
  it("never blocks an unlimited plan", async () => {
    limits.maxEmployees = null
    limits.maxAtendentes = null
    for (let n = 0; n < 3; n++) {
      const user = await createUser()
      await createEmployeeRow(user.id, shop.id)
      await createMembership((await createUser()).id, shop.id, "ATENDENTE")
    }

    await expect(assertPlanLimit(shop, "employees")).resolves.toBeUndefined()
    await expect(assertPlanLimit(shop, "atendentes")).resolves.toBeUndefined()
  })

  it("counts active barbers and pending invitations, not inactive ones", async () => {
    const barber = await createUser()
    await createEmployeeRow(barber.id, shop.id)
    const former = await createUser()
    const inactive = await createEmployeeRow(former.id, shop.id)
    await prisma.employee.update({
      where: { id: inactive.id },
      data: { isActive: false },
    })
    // Expired, accepted, other-role and other-shop invitations do not count
    await pendingInvitation(shop.id, "expirado@test.local", "EMPLOYEE", {
      expiresAt: new Date(Date.now() - 1000),
    })
    await pendingInvitation(shop.id, "aceito@test.local", "EMPLOYEE", {
      acceptedAt: new Date(),
    })
    await pendingInvitation(shop.id, "atendente@test.local", "ATENDENTE")
    await pendingInvitation(otherShop.id, "outra@test.local", "EMPLOYEE")

    // 1 active barber: one more fits
    await expect(assertPlanLimit(shop, "employees")).resolves.toBeUndefined()

    // + 1 pending invitation = 2: full
    await pendingInvitation(shop.id, "pendente@test.local", "EMPLOYEE")
    await expect(assertPlanLimit(shop, "employees")).rejects.toThrow(
      EMPLOYEE_LIMIT,
    )
    // Re-inviting the pending email replaces its invitation: still fits
    await expect(
      assertPlanLimit(shop, "employees", {
        invitationEmail: "PENDENTE@test.local",
      }),
    ).resolves.toBeUndefined()
  })

  it("counts ATENDENTE memberships plus pending ATENDENTE invitations", async () => {
    await pendingInvitation(shop.id, "nova@test.local", "ATENDENTE")

    await expect(assertPlanLimit(shop, "atendentes")).rejects.toThrow(
      ATENDENTE_LIMIT,
    )
    // The other shop is not affected
    await expect(
      assertPlanLimit(otherShop, "atendentes"),
    ).resolves.toBeUndefined()
  })
})

describe("staff actions under a limited plan", () => {
  it("createEmployee stops at the limit, counting a pending invitation", async () => {
    await unwrap(createEmployee("barbearia-a", newBarber(1)))
    // An existing account gets an invitation, which takes the second seat
    await createUser({ email: "existente@test.local" })
    const invited = await unwrap(
      createEmployee("barbearia-a", { email: "existente@test.local" }),
    )
    expect(invited.invited).toBe(true)

    await expect(
      unwrap(createEmployee("barbearia-a", newBarber(2))),
    ).rejects.toThrow(EMPLOYEE_LIMIT)
    await createUser({ email: "outro@test.local" })
    await expect(
      unwrap(createEmployee("barbearia-a", { email: "outro@test.local" })),
    ).rejects.toThrow(EMPLOYEE_LIMIT)
    // The shop's own ADMIN getting an Employee row takes a seat too
    await expect(
      unwrap(createEmployee("barbearia-a", { email: admin.email! })),
    ).rejects.toThrow(EMPLOYEE_LIMIT)

    expect(
      await prisma.user.count({ where: { email: "barbeiro2@test.local" } }),
    ).toBe(0)
    expect(
      await prisma.invitation.count({
        where: { email: "outro@test.local" },
      }),
    ).toBe(0)
    expect(
      await prisma.employee.count({ where: { barbershopId: shop.id } }),
    ).toBe(1)

    // Re-sending the pending invitation is not blocked by its own seat
    await expect(
      unwrap(createEmployee("barbearia-a", { email: "existente@test.local" })),
    ).resolves.toMatchObject({ invited: true })
  })

  it("createAtendente stops at the limit, counting a pending invitation", async () => {
    await createUser({ email: "existente@test.local" })
    await unwrap(
      createAtendente("barbearia-a", { email: "existente@test.local" }),
    )

    await expect(
      unwrap(createAtendente("barbearia-a", newAtendente(1))),
    ).rejects.toThrow(ATENDENTE_LIMIT)
    expect(
      await prisma.user.count({ where: { email: "atendente1@test.local" } }),
    ).toBe(0)

    // Once the invitation is gone, a new account fits again
    await prisma.invitation.deleteMany({ where: { barbershopId: shop.id } })
    await unwrap(createAtendente("barbearia-a", newAtendente(1)))
    await expect(
      unwrap(createAtendente("barbearia-a", newAtendente(2))),
    ).rejects.toThrow(ATENDENTE_LIMIT)
    expect(
      await prisma.membership.count({
        where: { barbershopId: shop.id, role: "ATENDENTE" },
      }),
    ).toBe(1)
  })
})
