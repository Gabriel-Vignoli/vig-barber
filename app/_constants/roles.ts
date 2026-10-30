import type { MemberRole } from "@/app/generated/prisma/enums"

// Staff roles that cannot book as customers in the shop where they hold them
export const BOOKING_BLOCKED_ROLES: readonly MemberRole[] = [
  "ADMIN",
  "ATENDENTE",
]

export const isBookingBlockedRole = (role: MemberRole | null | undefined) =>
  !!role && BOOKING_BLOCKED_ROLES.includes(role)

// The area under /b/<slug> that each role opens
const SHOP_AREA_BY_ROLE: Record<MemberRole, string> = {
  ADMIN: "admin",
  ATENDENTE: "atendente",
  EMPLOYEE: "staff",
}

export const getShopAreaPath = (slug: string, role: MemberRole) =>
  `/b/${slug}/${SHOP_AREA_BY_ROLE[role]}`

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  ADMIN: "Administrador",
  ATENDENTE: "Atendente",
  EMPLOYEE: "Barbeiro",
}
