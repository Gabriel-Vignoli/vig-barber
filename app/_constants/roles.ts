import type { MemberRole } from "@/app/generated/prisma/enums"

// Staff roles that cannot book as customers in the shop where they hold them
export const BOOKING_BLOCKED_ROLES: readonly MemberRole[] = [
  "ADMIN",
  "ATENDENTE",
]

export const isBookingBlockedRole = (role: MemberRole | null | undefined) =>
  !!role && BOOKING_BLOCKED_ROLES.includes(role)
