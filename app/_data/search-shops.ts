import { billingActiveWhere } from "../_lib/billing"
import { prisma } from "../_lib/prisma"
import { parseShopSearchQuery } from "../_lib/validations/shop-search"

export const SHOP_SEARCH_LIMIT = 24

// Prisma sends `contains` as ILIKE '%value%' without escaping, so a bare "%"
// or "_" would match every shop. Backslash is Postgres' default LIKE escape.
const escapeLikePattern = (value: string) =>
  value.replace(/[\\%_]/g, (char) => `\\${char}`)

// Public shop finder for the landing page. Only ACTIVE shops whose billing
// lets them take bookings (trial, paid or inside the grace period), only
// public fields. A query matches the name or the city, case-insensitive; an empty
// query lists the active shops by name. Fetches one extra row to tell the
// page that there are more results than it shows.
export const searchShops = async (rawQuery?: unknown) => {
  const query = parseShopSearchQuery(rawQuery)
  const pattern = escapeLikePattern(query)

  const rows = await prisma.barbershop.findMany({
    where: {
      status: "ACTIVE",
      // AND keeps the billing OR apart from the name/city OR
      AND: [
        billingActiveWhere(new Date()),
        ...(query
          ? [
              {
                OR: [
                  { name: { contains: pattern, mode: "insensitive" as const } },
                  { city: { contains: pattern, mode: "insensitive" as const } },
                ],
              },
            ]
          : []),
      ],
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: SHOP_SEARCH_LIMIT + 1,
    select: {
      slug: true,
      name: true,
      city: true,
      address: true,
      logoUrl: true,
      bannerUrl: true,
    },
  })

  return {
    query,
    shops: rows.slice(0, SHOP_SEARCH_LIMIT),
    hasMore: rows.length > SHOP_SEARCH_LIMIT,
  }
}

export type ShopSearchResult = Awaited<
  ReturnType<typeof searchShops>
>["shops"][number]
