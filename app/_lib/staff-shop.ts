import type { MemberRole } from "@/app/generated/prisma/enums"
import { prisma } from "./prisma"

// Transitional helpers for URLs that do not carry a shop slug (legacy
// /admin/*, /admin/atendente/*, the EMPLOYEE branch of /, and the redirect
// after /admin/login).
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
// the user has no staff role in any active shop
export const getStaffLandingPath = async (userId: string) => {
  const adminShop = await getFirstShopWithRole(userId, ["ADMIN"])

  if (adminShop) return `/b/${adminShop.slug}/admin`

  const atendenteShop = await getFirstShopWithRole(userId, ["ATENDENTE"])

  if (atendenteShop) return `/b/${atendenteShop.slug}/atendente`

  const employeeShop = await getFirstShopWithRole(userId, ["EMPLOYEE"])

  if (employeeShop) return `/b/${employeeShop.slug}/staff`

  return null
}
