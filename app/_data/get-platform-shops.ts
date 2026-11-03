import { prisma } from "../_lib/prisma"

// Every shop for the platform panel (callers run requirePlatformAdmin first).
// The Stripe subscription id only feeds hasLiveSubscription on the server.
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
      subscriptionStatus: true,
      trialEndsAt: true,
      pastDueSince: true,
      stripeSubscriptionId: true,
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
