import type { MemberRole } from "@/app/generated/prisma/enums"
import { getShopAreaPath } from "../_constants/roles"
import { prisma } from "./prisma"
import { getSafeCallbackUrl } from "./safe-callback-url"

// The oldest active shop where the user holds one of these roles. Used by the
// legacy URLs that carry no slug (/admin/*, /admin/atendente/*) and by /.
export const getFirstShopWithRole = async (
  userId: string,
  roles: MemberRole[],
) => {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      role: { in: roles },
      barbershop: { status: "ACTIVE" },
    },
    orderBy: { createdAt: "asc" },
    select: { barbershop: { select: { id: true, slug: true } } },
  })

  return membership?.barbershop ?? null
}

// Where a staff member lands after logging in: the area of their only active
// shop, /painel when they belong to several, or null without memberships
export const getStaffLandingPath = async (userId: string) => {
  const memberships = await prisma.membership.findMany({
    where: { userId, barbershop: { status: "ACTIVE" } },
    orderBy: { createdAt: "asc" },
    take: 2,
    select: { role: true, barbershop: { select: { slug: true } } },
  })

  if (memberships.length === 0) return null
  if (memberships.length > 1) return "/painel"

  const [membership] = memberships

  return getShopAreaPath(membership.barbershop.slug, membership.role)
}

// After login: a safe same-origin callbackUrl wins, then the staff area, then /
export const resolvePostLoginPath = async (
  userId: string,
  callbackUrl?: unknown,
) =>
  getSafeCallbackUrl(callbackUrl) ?? (await getStaffLandingPath(userId)) ?? "/"
