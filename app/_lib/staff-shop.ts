import type { MemberRole } from "@/app/generated/prisma/enums"
import { prisma } from "./prisma"

// Transitional helpers for URLs that do not carry a shop slug yet (legacy
// /admin/*, /admin/login, /admin/atendente).
// TODO(Phase 4c): replaced by the /painel membership chooser

// The oldest active shop where the user holds one of these roles
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

// Where a staff member lands after logging in on /admin/login, or null when
// the user has no admin/atendente role in any active shop
export const getStaffLandingPath = async (userId: string) => {
  const adminShop = await getFirstShopWithRole(userId, ["ADMIN"])

  if (adminShop) return `/b/${adminShop.slug}/admin`

  const atendenteShop = await getFirstShopWithRole(userId, ["ATENDENTE"])

  // TODO(Phase 4b): /b/[slug]/atendente
  if (atendenteShop) return "/admin/atendente"

  return null
}

// TODO(Phase 4b): the atendente pages move to /b/[slug]/atendente and get the
// shop from the URL. Until then, use the first shop where the user is staff,
// or the oldest active shop for global ADMINs without a membership (the old
// singleton behaviour).
export const getAtendenteShop = async (userId: string) => {
  const shop = await getFirstShopWithRole(userId, ["ADMIN", "ATENDENTE"])

  if (shop) return shop

  return prisma.barbershop.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: { id: true, slug: true },
  })
}
