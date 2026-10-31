import { prisma } from "../_lib/prisma"

// Every shop for the platform panel (callers run requirePlatformAdmin first)
export const getPlatformShops = () =>
  prisma.barbershop.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      status: true,
      plan: true,
      createdAt: true,
      _count: {
        select: {
          memberships: true,
          invitations: {
            where: { acceptedAt: null, expiresAt: { gt: new Date() } },
          },
        },
      },
    },
  })

export type PlatformShop = Awaited<ReturnType<typeof getPlatformShops>>[number]
