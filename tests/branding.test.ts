import { describe, expect, it } from "vitest"
import {
  getMapsEmbedUrl,
  getMapsQuery,
  getMapsSearchUrl,
} from "@/app/_lib/maps"
import { uploadRouter } from "@/app/api/uploadthing/core"
import { createMembership, createShop, createUser } from "./helpers/factories"
import { mockSession } from "./helpers/session"

const LOCATION = {
  address: "Rua Augusta, 1450 - Consolação",
  city: "São Paulo",
  latitude: null,
  longitude: null,
}

describe("maps helpers", () => {
  it("prefers the coordinates when both are set", () => {
    expect(
      getMapsQuery({ ...LOCATION, latitude: -23.5568, longitude: -46.6608 }),
    ).toBe("-23.5568,-46.6608")
  })

  it("uses the address plus the city without coordinates", () => {
    expect(getMapsQuery(LOCATION)).toBe(
      "Rua Augusta, 1450 - Consolação, São Paulo",
    )
  })

  it("does not repeat the city already in the address", () => {
    expect(
      getMapsQuery({
        ...LOCATION,
        address: "Rua Augusta, 1450, São Paulo - SP",
      }),
    ).toBe("Rua Augusta, 1450, São Paulo - SP")
    expect(getMapsQuery({ ...LOCATION, city: null })).toBe(LOCATION.address)
  })

  it("ignores a single coordinate", () => {
    expect(getMapsQuery({ ...LOCATION, latitude: -23.5 })).toBe(
      "Rua Augusta, 1450 - Consolação, São Paulo",
    )
  })

  it("builds a keyless embed URL and a search link, both encoded", () => {
    const embed = new URL(getMapsEmbedUrl(LOCATION))
    expect(embed.origin).toBe("https://www.google.com")
    expect(embed.searchParams.get("output")).toBe("embed")
    expect(embed.searchParams.get("q")).toBe(getMapsQuery(LOCATION))
    expect(embed.searchParams.has("key")).toBe(false)

    const search = new URL(getMapsSearchUrl(LOCATION))
    expect(search.pathname).toBe("/maps/search/")
    expect(search.searchParams.get("query")).toBe(getMapsQuery(LOCATION))
  })
})

describe("uploadthing shopImage middleware", () => {
  const runMiddleware = (slug: string) =>
    uploadRouter.shopImage.middleware({
      input: { slug },
      req: new Request("http://localhost/api/uploadthing"),
      files: [],
    } as never)

  it("lets the shop admin upload and returns the shop id", async () => {
    const shop = await createShop({ slug: "barbearia-a" })
    const admin = await createUser()
    await createMembership(admin.id, shop.id, "ADMIN")
    mockSession(admin.id)

    await expect(runMiddleware("barbearia-a")).resolves.toEqual({
      shopId: shop.id,
    })
  })

  it("rejects signed-out users, other roles and admins of another shop", async () => {
    const shopA = await createShop({ slug: "barbearia-a" })
    const shopB = await createShop({ slug: "barbearia-b" })
    const atendente = await createUser()
    const adminB = await createUser()
    await createMembership(atendente.id, shopA.id, "ATENDENTE")
    await createMembership(adminB.id, shopB.id, "ADMIN")

    await expect(runMiddleware("barbearia-a")).rejects.toThrow(
      "Você precisa estar logado.",
    )

    mockSession(atendente.id)
    await expect(runMiddleware("barbearia-a")).rejects.toThrow("Sem permissão.")

    mockSession(adminB.id)
    await expect(runMiddleware("barbearia-a")).rejects.toThrow("Sem permissão.")
  })
})
