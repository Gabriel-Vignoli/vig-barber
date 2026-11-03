import { beforeEach, describe, expect, it } from "vitest"
import { updateTag } from "next/cache"
import { prisma } from "@/app/_lib/prisma"
import {
  assertShopRole,
  getActiveShopOrThrow,
  getTenant,
  shopSlugTag,
  shopTag,
} from "@/app/_lib/tenant"
import {
  assertPlatformAdmin,
  requirePlatformAdmin,
} from "@/app/_lib/platform-admin"
import { createShop } from "@/app/_actions/create-shop"
import { updateShopStatus } from "@/app/_actions/update-shop-status"
import { inviteShopMember } from "@/app/_actions/invite-shop-member"
import { extendTrial } from "@/app/_actions/extend-trial"
import { hasLiveSubscription } from "@/app/_lib/billing"
import { getPlatformShops } from "@/app/_data/get-platform-shops"
import {
  createMembership,
  createShop as createShopRow,
  createUser,
} from "./helpers/factories"
import { failNextEmail, getSentEmails } from "./helpers/email"
import { NotFoundError, RedirectError } from "./helpers/navigation"
import { mockSession } from "./helpers/session"
import { unwrap } from "@/app/_lib/action-result"
import { addDays, TRIAL_DAYS } from "@/app/_lib/plans"

const shopInput = (
  overrides: Partial<Parameters<typeof createShop>[0]> = {},
) => ({
  name: "Barbearia Nova",
  slug: "barbearia-nova",
  address: "Rua Nova, 100",
  city: "Campinas",
  phone: "",
  ownerEmail: "Dono@Test.local",
  ...overrides,
})

let platformAdmin: Awaited<ReturnType<typeof createUser>>
let shopAdmin: Awaited<ReturnType<typeof createUser>>
let shop: Awaited<ReturnType<typeof createShopRow>>

beforeEach(async () => {
  platformAdmin = await createUser({ isPlatformAdmin: true })
  shopAdmin = await createUser()
  shop = await createShopRow({ slug: "barbearia-a" })
  await createMembership(shopAdmin.id, shop.id, "ADMIN")
})

describe("platform admin gating", () => {
  it("sends a signed-out visitor to the login", async () => {
    await expect(requirePlatformAdmin()).rejects.toThrow(RedirectError)
    await expect(requirePlatformAdmin()).rejects.toMatchObject({
      url: "/login?callbackUrl=%2Fplatform",
    })
    await expect(assertPlatformAdmin()).rejects.toThrow(
      "Você precisa estar logado.",
    )
  })

  it("hides the panel from shop admins and clients", async () => {
    mockSession(shopAdmin.id)

    await expect(requirePlatformAdmin()).rejects.toThrow(NotFoundError)
    await expect(assertPlatformAdmin()).rejects.toThrow("Sem permissão.")
  })

  it("lets a platform admin in", async () => {
    mockSession(platformAdmin.id)

    await expect(requirePlatformAdmin()).resolves.toEqual({
      userId: platformAdmin.id,
    })
    await expect(assertPlatformAdmin()).resolves.toEqual({
      userId: platformAdmin.id,
    })
  })

  it("reads the flag from the database on every request", async () => {
    mockSession(platformAdmin.id)
    await prisma.user.update({
      where: { id: platformAdmin.id },
      data: { isPlatformAdmin: false },
    })

    await expect(assertPlatformAdmin()).rejects.toThrow("Sem permissão.")
  })

  it("rejects every platform action for a shop admin", async () => {
    mockSession(shopAdmin.id)

    await expect(unwrap(createShop(shopInput()))).rejects.toThrow(
      "Sem permissão.",
    )
    await expect(
      unwrap(updateShopStatus(shop.id, "SUSPENDED")),
    ).rejects.toThrow("Sem permissão.")
    await expect(
      unwrap(
        inviteShopMember(shop.id, { email: "x@test.local", role: "ADMIN" }),
      ),
    ).rejects.toThrow("Sem permissão.")
    await expect(unwrap(extendTrial(shop.id, 30))).rejects.toThrow(
      "Sem permissão.",
    )

    expect(await prisma.barbershop.count()).toBe(1)
    expect(
      (await prisma.barbershop.findUniqueOrThrow({ where: { id: shop.id } }))
        .status,
    ).toBe("ACTIVE")
    expect(await prisma.invitation.count()).toBe(0)
  })
})

describe("createShop", () => {
  beforeEach(() => mockSession(platformAdmin.id))

  it("creates the shop and invites its owner as ADMIN", async () => {
    const result = await unwrap(createShop(shopInput({ phone: "11988887777" })))

    expect(result).toEqual({
      slug: "barbearia-nova",
      emailSent: true,
      inviteUrl: expect.stringContaining("/convite/"),
    })
    const created = await prisma.barbershop.findUniqueOrThrow({
      where: { slug: "barbearia-nova" },
    })
    expect(created).toMatchObject({
      name: "Barbearia Nova",
      city: "Campinas",
      status: "ACTIVE",
      phones: ["11988887777"],
    })
    expect(await prisma.invitation.findMany()).toMatchObject([
      {
        barbershopId: created.id,
        email: "dono@test.local",
        role: "ADMIN",
        invitedById: platformAdmin.id,
      },
    ])
    expect(getSentEmails()).toMatchObject([{ to: "dono@test.local" }])
    // Nobody becomes a member until the invitation is accepted
    expect(
      await prisma.membership.count({ where: { barbershopId: created.id } }),
    ).toBe(0)
  })

  it("starts a 14-day trial on the BASIC plan", async () => {
    const before = Date.now()
    await unwrap(createShop(shopInput()))
    const after = Date.now()

    const created = await prisma.barbershop.findUniqueOrThrow({
      where: { slug: "barbearia-nova" },
    })
    expect(created).toMatchObject({
      plan: "BASIC",
      subscriptionStatus: "TRIALING",
      pastDueSince: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    })
    const day = 24 * 60 * 60 * 1000
    const trialEnd = created.trialEndsAt!.getTime()
    expect(trialEnd).toBeGreaterThanOrEqual(before + TRIAL_DAYS * day)
    expect(trialEnd).toBeLessThanOrEqual(after + TRIAL_DAYS * day)
    expect(TRIAL_DAYS).toBe(14)
  })

  it("rejects a slug in use, reserved or invalid", async () => {
    await expect(
      unwrap(createShop(shopInput({ slug: "barbearia-a" }))),
    ).rejects.toThrow("Este endereço já está em uso. Escolha outro.")
    await expect(
      unwrap(createShop(shopInput({ slug: "platform" }))),
    ).rejects.toThrow("Este endereço é reservado. Escolha outro.")
    await expect(
      unwrap(createShop(shopInput({ slug: "Com Espaço" }))),
    ).rejects.toThrow("Use apenas letras minúsculas")
    expect(await prisma.barbershop.count()).toBe(1)
  })

  it("keeps the shop when the owner email fails", async () => {
    failNextEmail()

    const result = await unwrap(createShop(shopInput()))

    expect(result).toMatchObject({ slug: "barbearia-nova", emailSent: false })
    expect(await prisma.barbershop.count()).toBe(2)
    // The invitation stays, so the link can be copied and sent by hand
    expect(await prisma.invitation.count()).toBe(1)
  })
})

describe("updateShopStatus", () => {
  beforeEach(() => mockSession(platformAdmin.id))

  it("suspends a shop (it 404s) and reactivates it", async () => {
    await unwrap(updateShopStatus(shop.id, "SUSPENDED"))

    await expect(getTenant("barbearia-a")).rejects.toThrow(NotFoundError)
    await expect(getActiveShopOrThrow("barbearia-a")).rejects.toThrow(
      "Barbearia não encontrada.",
    )

    await unwrap(updateShopStatus(shop.id, "ACTIVE"))

    await expect(getActiveShopOrThrow("barbearia-a")).resolves.toMatchObject({
      id: shop.id,
    })
  })

  it("rejects an unknown shop or status", async () => {
    await expect(
      unwrap(updateShopStatus("nao-existe", "SUSPENDED")),
    ).rejects.toThrow("Barbearia não encontrada.")
    await expect(
      // @ts-expect-error a tampered client can send anything
      unwrap(updateShopStatus(shop.id, "DELETED")),
    ).rejects.toThrow("Status inválido.")
  })
})

describe("inviteShopMember", () => {
  beforeEach(() => mockSession(platformAdmin.id))

  it("invites an email with a role", async () => {
    await unwrap(
      inviteShopMember(shop.id, {
        email: "Atendente@Test.local",
        role: "ATENDENTE",
      }),
    )

    expect(await prisma.invitation.findMany()).toMatchObject([
      {
        barbershopId: shop.id,
        email: "atendente@test.local",
        role: "ATENDENTE",
      },
    ])
  })

  it("rejects an existing member, an invalid role and an unknown shop", async () => {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { id: shopAdmin.id },
    })

    await expect(
      unwrap(
        inviteShopMember(shop.id, { email: admin.email!, role: "EMPLOYEE" }),
      ),
    ).rejects.toThrow("Este usuário já faz parte da equipe desta barbearia.")
    await expect(
      unwrap(
        inviteShopMember(shop.id, { email: "x@test.local", role: "OWNER" }),
      ),
    ).rejects.toThrow("Selecione um papel.")
    await expect(
      unwrap(
        inviteShopMember("nao-existe", {
          email: "x@test.local",
          role: "ADMIN",
        }),
      ),
    ).rejects.toThrow("Barbearia não encontrada.")
    expect(await prisma.invitation.count()).toBe(0)
  })

  it("reports a failed email and still returns the link", async () => {
    failNextEmail()

    const result = await unwrap(
      inviteShopMember(shop.id, { email: "x@test.local", role: "ADMIN" }),
    )

    expect(result).toEqual({
      emailSent: false,
      inviteUrl: expect.stringContaining("/convite/"),
    })
    expect(await prisma.invitation.count()).toBe(1)
  })
})

describe("getPlatformShops", () => {
  it("counts members and pending invitations per shop", async () => {
    mockSession(platformAdmin.id)
    await unwrap(
      inviteShopMember(shop.id, { email: "x@test.local", role: "ADMIN" }),
    )
    await createShopRow({ slug: "suspensa", status: "SUSPENDED" })

    const shops = await getPlatformShops()

    expect(shops).toHaveLength(2)
    expect(shops.find((s) => s.id === shop.id)?._count).toEqual({
      memberships: 1,
      invitations: 1,
    })
  })
})

describe("extendTrial", () => {
  const PENDING = "A assinatura desta barbearia está pendente."

  beforeEach(() => mockSession(platformAdmin.id))

  const readShop = () =>
    prisma.barbershop.findUniqueOrThrow({ where: { id: shop.id } })

  it("is refused to a signed-out visitor and to a shop admin", async () => {
    const before = await readShop()

    mockSession(null)
    await expect(unwrap(extendTrial(shop.id, 7))).rejects.toThrow(
      "Você precisa estar logado.",
    )

    mockSession(shopAdmin.id)
    await expect(unwrap(extendTrial(shop.id, 7))).rejects.toThrow(
      "Sem permissão.",
    )

    expect((await readShop()).trialEndsAt).toEqual(before.trialEndsAt)
    expect(updateTag).not.toHaveBeenCalled()
  })

  it("adds the days to a running trial", async () => {
    const trialEndsAt = addDays(new Date(), 3)
    await prisma.barbershop.update({
      where: { id: shop.id },
      data: { trialEndsAt },
    })

    const result = await unwrap(extendTrial(shop.id, 10))

    const expected = addDays(trialEndsAt, 10)
    expect(result.trialEndsAt).toEqual(expected)
    expect(await readShop()).toMatchObject({
      subscriptionStatus: "TRIALING",
      trialEndsAt: expected,
    })
  })

  it("restarts an ended trial from now and opens the billing gate", async () => {
    await prisma.barbershop.update({
      where: { id: shop.id },
      data: { trialEndsAt: addDays(new Date(), -30) },
    })
    mockSession(shopAdmin.id)
    await expect(assertShopRole("barbearia-a", ["ADMIN"])).rejects.toThrow(
      PENDING,
    )

    mockSession(platformAdmin.id)
    const before = Date.now()
    await unwrap(extendTrial(shop.id, 5))
    const after = Date.now()

    const updated = await readShop()
    expect(updated.trialEndsAt!.getTime()).toBeGreaterThanOrEqual(
      addDays(new Date(before), 5).getTime(),
    )
    expect(updated.trialEndsAt!.getTime()).toBeLessThanOrEqual(
      addDays(new Date(after), 5).getTime(),
    )
    // Both cache tags expire, so the gate reads the new trial right away
    expect(updateTag).toHaveBeenCalledWith(shopTag(shop.id))
    expect(updateTag).toHaveBeenCalledWith(shopSlugTag("barbearia-a"))

    mockSession(shopAdmin.id)
    await expect(
      assertShopRole("barbearia-a", ["ADMIN"]),
    ).resolves.toMatchObject({ shop: { id: shop.id } })
  })

  it("brings a canceled shop back to a trial and drops the ended subscription", async () => {
    await prisma.barbershop.update({
      where: { id: shop.id },
      data: {
        subscriptionStatus: "CANCELED",
        stripeCustomerId: "cus_old",
        stripeSubscriptionId: "sub_ended",
        currentPeriodEnd: addDays(new Date(), -2),
        trialEndsAt: null,
      },
    })

    await unwrap(extendTrial(shop.id, 14))

    const updated = await readShop()
    expect(updated).toMatchObject({
      subscriptionStatus: "TRIALING",
      stripeCustomerId: "cus_old",
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      pastDueSince: null,
    })
    expect(updated.trialEndsAt!.getTime()).toBeGreaterThan(Date.now())
    // A new checkout is not blocked by the old subscription
    expect(hasLiveSubscription(updated)).toBe(false)
  })

  it.each(["ACTIVE", "TRIALING", "PAST_DUE"] as const)(
    "refuses a shop with a live %s Stripe subscription",
    async (subscriptionStatus) => {
      await prisma.barbershop.update({
        where: { id: shop.id },
        data: {
          subscriptionStatus,
          stripeCustomerId: "cus_live",
          stripeSubscriptionId: "sub_live",
          pastDueSince: subscriptionStatus === "PAST_DUE" ? new Date() : null,
        },
      })
      const before = await readShop()

      await expect(unwrap(extendTrial(shop.id, 7))).rejects.toThrow(
        "Esta barbearia tem uma assinatura ativa no Stripe.",
      )
      expect(await readShop()).toEqual(before)
    },
  )

  it("rejects invalid days and an unknown shop", async () => {
    for (const days of [0, -3, 1.5, 366, Number.NaN]) {
      await expect(
        unwrap(extendTrial(shop.id, days)),
        `days = ${days}`,
      ).rejects.toThrow()
    }
    await expect(unwrap(extendTrial(shop.id, 0))).rejects.toThrow(
      "Informe pelo menos 1 dia.",
    )
    await expect(unwrap(extendTrial(shop.id, 366))).rejects.toThrow(
      "O máximo é 365 dias por vez.",
    )
    await expect(unwrap(extendTrial("missing-shop", 7))).rejects.toThrow(
      "Barbearia não encontrada.",
    )
    expect(updateTag).not.toHaveBeenCalled()
  })
})
