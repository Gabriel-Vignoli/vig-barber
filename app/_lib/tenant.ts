import { cache } from "react"
import { getServerSession } from "next-auth"
import { unstable_cache } from "next/cache"
import { notFound, redirect } from "next/navigation"
import type { MemberRole } from "@/app/generated/prisma/enums"
import { authOptions } from "./auth"
import { prisma } from "./prisma"
import { getLoginPath } from "./protected-paths"

// Cache tag for everything that belongs to one shop (services, employees, stats...)
export const shopTag = (barbershopId: string) => `shop:${barbershopId}`

// Cache tag for the slug -> shop lookup used by getTenant
export const shopSlugTag = (slug: string) => `shop-slug:${slug}`

// Stripe ids stay out of the tenant object so they never reach a page by accident
const tenantSelect = {
  id: true,
  slug: true,
  name: true,
  address: true,
  city: true,
  latitude: true,
  longitude: true,
  phones: true,
  description: true,
  logoUrl: true,
  bannerUrl: true,
  instagramUrl: true,
  status: true,
  plan: true,
  subscriptionStatus: true,
  trialEndsAt: true,
  createdAt: true,
  updatedAt: true,
} as const

const fetchShopBySlug = (slug: string) =>
  prisma.barbershop.findUnique({ where: { slug }, select: tenantSelect })

export type Tenant = NonNullable<Awaited<ReturnType<typeof fetchShopBySlug>>>

export type ShopAccess = {
  shop: Tenant
  userId: string
  membership: { id: string; role: MemberRole }
}

// unstable_cache serializes to JSON, so Date fields come back as strings
const hydrateTenant = (shop: Tenant): Tenant => ({
  ...shop,
  trialEndsAt: shop.trialEndsAt ? new Date(shop.trialEndsAt) : null,
  createdAt: new Date(shop.createdAt),
  updatedAt: new Date(shop.updatedAt),
})

// Returns the active shop for this slug, or null if it is missing or suspended
const findActiveShop = cache(async (slug: string): Promise<Tenant | null> => {
  const shop = await unstable_cache(
    () => fetchShopBySlug(slug),
    ["shop-by-slug", slug],
    { tags: [shopSlugTag(slug)], revalidate: 300 },
  )()

  if (!shop || shop.status === "SUSPENDED") return null

  return hydrateTenant(shop)
})

// Pages and layouts under /b/[slug]: 404 when the shop is missing or suspended
export const getTenant = cache(async (slug: string): Promise<Tenant> => {
  const shop = await findActiveShop(slug)

  if (!shop) notFound()

  return shop
})

// For public server actions (clients are not members): throws instead of notFound
export const getActiveShopOrThrow = async (slug: string): Promise<Tenant> => {
  const shop = await findActiveShop(slug)

  if (!shop) {
    throw new Error("Barbearia não encontrada.")
  }

  return shop
}

export const getSessionUserId = cache(async (): Promise<string | null> => {
  const session = await getServerSession(authOptions)

  if (!session?.user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id as string | undefined

  return userId ?? null
})

export const getMembership = cache((barbershopId: string, userId: string) =>
  prisma.membership.findUnique({
    where: { userId_barbershopId: { userId, barbershopId } },
    select: { id: true, role: true },
  }),
)

// For pages: redirects instead of throwing. Platform admins get no implicit access.
export const requireShopRole = async (
  slug: string,
  roles: MemberRole[],
): Promise<ShopAccess> => {
  const shop = await getTenant(slug)
  const userId = await getSessionUserId()

  if (!userId) {
    // proxy.ts already sends signed-out users to /login with the exact URL;
    // this is the fallback (e.g. the session expired mid-request)
    redirect(getLoginPath(`/b/${slug}`))
  }

  const membership = await getMembership(shop.id, userId)

  if (!membership || !roles.includes(membership.role)) {
    redirect(`/b/${slug}`)
  }

  return { shop, userId, membership }
}

// For server actions: throws pt-BR errors (never notFound/redirect)
export const assertShopRole = async (
  slug: string,
  roles: MemberRole[],
): Promise<ShopAccess> => {
  const userId = await getSessionUserId()

  if (!userId) {
    throw new Error("Você precisa estar logado.")
  }

  const shop = await findActiveShop(slug)

  if (!shop) {
    throw new Error("Barbearia não encontrada.")
  }

  const membership = await getMembership(shop.id, userId)

  if (!membership || !roles.includes(membership.role)) {
    throw new Error("Sem permissão.")
  }

  return { shop, userId, membership }
}
