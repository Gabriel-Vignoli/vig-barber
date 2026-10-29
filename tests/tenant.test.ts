import { describe, expect, it } from "vitest"
import { prisma } from "@/app/_lib/prisma"
import { revalidateShop } from "@/app/_lib/revalidate"
import {
  assertShopRole,
  getMembership,
  getTenant,
  requireShopRole,
  shopTag,
} from "@/app/_lib/tenant"
import { slugSchema } from "@/app/_lib/validations/slug"
import { revalidatePath, updateTag } from "next/cache"
import { createMembership, createShop, createUser } from "./helpers/factories"
import { NotFoundError } from "./helpers/navigation"
import { mockSession } from "./helpers/session"

const redirectTo = (url: string) =>
  expect.objectContaining({ name: "RedirectError", url })

describe("getTenant", () => {
  it("returns the shop with Date fields rehydrated", async () => {
    const shop = await createShop({ slug: "barbearia-a" })

    const tenant = await getTenant("barbearia-a")

    expect(tenant.id).toBe(shop.id)
    expect(tenant.createdAt).toBeInstanceOf(Date)
    expect(tenant.createdAt.getTime()).toBe(shop.createdAt.getTime())
    expect(tenant).not.toHaveProperty("stripeCustomerId")
  })

  it("throws notFound for an unknown slug", async () => {
    await expect(getTenant("nao-existe")).rejects.toBeInstanceOf(NotFoundError)
  })

  it("throws notFound for a suspended shop", async () => {
    await createShop({ slug: "suspensa", status: "SUSPENDED" })

    await expect(getTenant("suspensa")).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe("requireShopRole", () => {
  it("redirects to login when signed out", async () => {
    await createShop({ slug: "barbearia-a" })

    await expect(requireShopRole("barbearia-a", ["ADMIN"])).rejects.toEqual(
      redirectTo("/admin/login?callbackUrl=%2Fb%2Fbarbearia-a"),
    )
  })

  it("redirects a non-member to the shop home", async () => {
    await createShop({ slug: "barbearia-a" })
    const user = await createUser()
    mockSession(user.id)

    await expect(requireShopRole("barbearia-a", ["ADMIN"])).rejects.toEqual(
      redirectTo("/b/barbearia-a"),
    )
  })

  it("redirects a member with the wrong role", async () => {
    const shop = await createShop({ slug: "barbearia-a" })
    const user = await createUser()
    await createMembership(user.id, shop.id, "EMPLOYEE")
    mockSession(user.id)

    await expect(
      requireShopRole("barbearia-a", ["ADMIN", "ATENDENTE"]),
    ).rejects.toEqual(redirectTo("/b/barbearia-a"))
  })

  it("does not give platform admins implicit access", async () => {
    await createShop({ slug: "barbearia-a" })
    const user = await createUser({ isPlatformAdmin: true })
    mockSession(user.id)

    await expect(requireShopRole("barbearia-a", ["ADMIN"])).rejects.toEqual(
      redirectTo("/b/barbearia-a"),
    )
  })

  it("throws notFound for an unknown slug", async () => {
    const user = await createUser()
    mockSession(user.id)

    await expect(
      requireShopRole("nao-existe", ["ADMIN"]),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it("returns shop, userId and membership for an allowed role", async () => {
    const shop = await createShop({ slug: "barbearia-a" })
    const user = await createUser()
    const membership = await createMembership(user.id, shop.id, "ATENDENTE")
    mockSession(user.id)

    const access = await requireShopRole("barbearia-a", ["ADMIN", "ATENDENTE"])

    expect(access.shop.id).toBe(shop.id)
    expect(access.userId).toBe(user.id)
    expect(access.membership).toEqual({ id: membership.id, role: "ATENDENTE" })
  })
})

describe("assertShopRole", () => {
  it("throws when signed out", async () => {
    await createShop({ slug: "barbearia-a" })

    await expect(assertShopRole("barbearia-a", ["ADMIN"])).rejects.toThrow(
      "Você precisa estar logado.",
    )
  })

  it("throws (not notFound) for an unknown or suspended shop", async () => {
    await createShop({ slug: "suspensa", status: "SUSPENDED" })
    const user = await createUser()
    mockSession(user.id)

    const unknown = assertShopRole("nao-existe", ["ADMIN"])
    await expect(unknown).rejects.toThrow("Barbearia não encontrada.")
    await expect(unknown).rejects.not.toBeInstanceOf(NotFoundError)
    await expect(assertShopRole("suspensa", ["ADMIN"])).rejects.toThrow(
      "Barbearia não encontrada.",
    )
  })

  it("throws for a non-member and for the wrong role", async () => {
    const shop = await createShop({ slug: "barbearia-a" })
    const outsider = await createUser()
    const employee = await createUser()
    await createMembership(employee.id, shop.id, "EMPLOYEE")

    mockSession(outsider.id)
    await expect(assertShopRole("barbearia-a", ["ADMIN"])).rejects.toThrow(
      "Sem permissão.",
    )

    mockSession(employee.id)
    await expect(assertShopRole("barbearia-a", ["ADMIN"])).rejects.toThrow(
      "Sem permissão.",
    )
  })

  it("returns shop, userId and membership for the right role", async () => {
    const shop = await createShop({ slug: "barbearia-a" })
    const user = await createUser()
    await createMembership(user.id, shop.id, "ADMIN")
    mockSession(user.id)

    const access = await assertShopRole("barbearia-a", ["ADMIN"])

    expect(access.shop).toMatchObject({ id: shop.id, slug: "barbearia-a" })
    expect(access.userId).toBe(user.id)
    expect(access.membership.role).toBe("ADMIN")
  })
})

describe("cross-shop isolation", () => {
  it("a membership in shop A gives nothing in shop B", async () => {
    const shopA = await createShop({ slug: "barbearia-a" })
    const shopB = await createShop({ slug: "barbearia-b" })
    const user = await createUser()
    await createMembership(user.id, shopA.id, "ADMIN")
    mockSession(user.id)

    expect(await getMembership(shopB.id, user.id)).toBeNull()
    await expect(assertShopRole("barbearia-b", ["ADMIN"])).rejects.toThrow(
      "Sem permissão.",
    )
    await expect(requireShopRole("barbearia-b", ["ADMIN"])).rejects.toEqual(
      redirectTo("/b/barbearia-b"),
    )
    await expect(assertShopRole("barbearia-a", ["ADMIN"])).resolves.toBeTruthy()
  })
})

describe("React cache() outside a request", () => {
  it("is a pass-through, so each call reads the database again", async () => {
    const shop = await createShop()
    const user = await createUser()
    const membership = await createMembership(user.id, shop.id, "ADMIN")

    expect(await getMembership(shop.id, user.id)).not.toBeNull()
    await prisma.membership.delete({ where: { id: membership.id } })
    expect(await getMembership(shop.id, user.id)).toBeNull()
  })
})

describe("revalidateShop", () => {
  it("expires the shop tags and the shop layout", () => {
    revalidateShop({ id: "shop-id", slug: "barbearia-a" })

    expect(updateTag).toHaveBeenCalledWith(shopTag("shop-id"))
    expect(updateTag).toHaveBeenCalledWith("shop-slug:barbearia-a")
    expect(revalidatePath).toHaveBeenCalledWith("/b/barbearia-a", "layout")
  })
})

describe("slugSchema", () => {
  it.each(["abc", "barbearia-do-ze", "a1-b2", "x".repeat(40)])(
    "accepts %s",
    (slug) => {
      expect(slugSchema.safeParse(slug).success).toBe(true)
    },
  )

  it.each([
    ["reserved", "admin"],
    ["reserved", "privacy-policy"],
    ["uppercase", "Barbearia"],
    ["too short", "ab"],
    ["too long", "x".repeat(41)],
    ["leading hyphen", "-abc"],
    ["trailing hyphen", "abc-"],
    ["invalid characters", "barbearia_ze"],
    ["accents", "barbeariação"],
  ])("rejects %s (%s)", (_reason, slug) => {
    expect(slugSchema.safeParse(slug).success).toBe(false)
  })

  it("explains reserved slugs in pt-BR", () => {
    const result = slugSchema.safeParse("login")
    expect(result.error?.issues[0].message).toBe(
      "Este endereço é reservado. Escolha outro.",
    )
  })
})
