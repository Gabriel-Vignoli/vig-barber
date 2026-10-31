import { describe, expect, it } from "vitest"
import { searchShops, SHOP_SEARCH_LIMIT } from "@/app/_data/search-shops"
import { parseShopSearchQuery } from "@/app/_lib/validations/shop-search"
import { createShop } from "./helpers/factories"

const slugsOf = (result: Awaited<ReturnType<typeof searchShops>>) =>
  result.shops.map((shop) => shop.slug)

describe("landing shop finder", () => {
  it("lists only active shops, by name, when there is no query", async () => {
    await createShop({ slug: "zeta", name: "Zeta Barber" })
    await createShop({ slug: "alfa", name: "Alfa Barbearia" })
    await createShop({
      slug: "suspensa",
      name: "Barbearia Suspensa",
      status: "SUSPENDED",
    })

    const result = await searchShops()

    expect(slugsOf(result)).toEqual(["alfa", "zeta"])
    expect(result.query).toBe("")
    expect(result.hasMore).toBe(false)
  })

  it("matches the name or the city, ignoring case", async () => {
    await createShop({
      slug: "corte-fino",
      name: "Corte Fino",
      city: "Campinas",
    })
    await createShop({
      slug: "navalha",
      name: "Navalha de Ouro",
      city: "São Paulo",
    })
    await createShop({ slug: "sem-cidade", name: "Barba Negra", city: null })

    expect(slugsOf(await searchShops("CORTE"))).toEqual(["corte-fino"])
    expect(slugsOf(await searchShops("ouro"))).toEqual(["navalha"])
    expect(slugsOf(await searchShops("campinas"))).toEqual(["corte-fino"])
    // Case folding of accented letters depends on the database locale (the
    // embedded test Postgres uses C), so only ASCII letters change case here
    expect(slugsOf(await searchShops("são PAULO"))).toEqual(["navalha"])
    expect(slugsOf(await searchShops("  negra  "))).toEqual(["sem-cidade"])
    expect(slugsOf(await searchShops("Recife"))).toEqual([])
  })

  it("never returns a suspended shop, even on an exact match", async () => {
    await createShop({
      slug: "fechada",
      name: "Barbearia Fechada",
      city: "Curitiba",
      status: "SUSPENDED",
    })
    await createShop({
      slug: "aberta",
      name: "Barbearia Aberta",
      city: "Curitiba",
    })

    expect(slugsOf(await searchShops("fechada"))).toEqual([])
    expect(slugsOf(await searchShops("curitiba"))).toEqual(["aberta"])
  })

  it("returns only public fields", async () => {
    await createShop({ slug: "publica", name: "Barbearia Pública" })

    const { shops } = await searchShops("pública")

    expect(Object.keys(shops[0]).sort()).toEqual(
      ["address", "bannerUrl", "city", "logoUrl", "name", "slug"].sort(),
    )
  })

  it("caps the results and flags that there are more", async () => {
    for (let i = 0; i < SHOP_SEARCH_LIMIT + 2; i++) {
      await createShop({ name: `Barbearia ${String(i).padStart(2, "0")}` })
    }

    const result = await searchShops("barbearia")

    expect(result.shops).toHaveLength(SHOP_SEARCH_LIMIT)
    expect(result.hasMore).toBe(true)
  })

  it("treats LIKE wildcards in the query as plain text", async () => {
    await createShop({ slug: "comum", name: "Barbearia Comum" })
    await createShop({ slug: "cem", name: "Barbearia 100% Navalha" })

    // A literal "%" only matches the shop whose name has one
    expect(slugsOf(await searchShops("%"))).toEqual(["cem"])
    expect(slugsOf(await searchShops("_"))).toEqual([])
    expect(slugsOf(await searchShops("\\"))).toEqual([])
    expect(slugsOf(await searchShops("100%"))).toEqual(["cem"])
  })

  it("normalizes the ?q= value", () => {
    expect(parseShopSearchQuery(undefined)).toBe("")
    expect(parseShopSearchQuery("  corte  ")).toBe("corte")
    expect(parseShopSearchQuery(["primeiro", "segundo"])).toBe("primeiro")
    expect(parseShopSearchQuery({ evil: true })).toBe("")
    expect(parseShopSearchQuery("a".repeat(200))).toHaveLength(80)
  })
})
