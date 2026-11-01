import { beforeEach, describe, expect, it } from "vitest"
import { prisma } from "@/app/_lib/prisma"
import { getActiveShopOrThrow, getTenant } from "@/app/_lib/tenant"
import {
  assertPlatformAdmin,
  requirePlatformAdmin,
} from "@/app/_lib/platform-admin"
import { createShop } from "@/app/_actions/create-shop"
import { updateShopStatus } from "@/app/_actions/update-shop-status"
import { inviteShopMember } from "@/app/_actions/invite-shop-member"
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
