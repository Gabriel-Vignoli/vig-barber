import { prisma } from "../_lib/prisma"

// The user's own memberships in active shops, for /painel
export const getUserMemberships = (userId: string) =>
  prisma.membership.findMany({
    where: { userId, barbershop: { status: "ACTIVE" } },
    orderBy: { barbershop: { name: "asc" } },
    select: {
      id: true,
      role: true,
      barbershop: {
        select: { id: true, slug: true, name: true, city: true, logoUrl: true },
      },
    },
  })
