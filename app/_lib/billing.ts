import type { Prisma } from "@/app/generated/prisma/client"
import type { SubscriptionStatus } from "@/app/generated/prisma/enums"
import { addDays, GRACE_DAYS } from "./plans"

// Pure billing rules: whether a shop may operate right now. Time math works on
// instants (Date), never on calendar days, so UTC vs São Paulo does not matter
// here; display goes through timezone.ts.
//
// | subscriptionStatus | access                                  |
// |--------------------|-----------------------------------------|
// | TRIALING           | while trialEndsAt > now                 |
// | ACTIVE             | yes                                     |
// | PAST_DUE           | while pastDueSince + GRACE_DAYS > now   |
// | CANCELED           | no                                      |
//
// A missing date (TRIALING without trialEndsAt, PAST_DUE without pastDueSince)
// fails closed: no access.

export type BillingShop = {
  subscriptionStatus: SubscriptionStatus
  trialEndsAt: Date | null
  pastDueSince: Date | null
}

export type BillingReason =
  | "TRIALING"
  | "TRIAL_ENDED"
  | "ACTIVE"
  | "PAST_DUE_GRACE"
  | "PAST_DUE_EXPIRED"
  | "CANCELED"

export type BillingState = {
  hasAccess: boolean
  reason: BillingReason
  // Whole days left in the trial, rounded up (TRIALING with access only)
  trialDaysLeft?: number
  // When the grace period ends (PAST_DUE only)
  graceEndsAt?: Date
}

const DAY_MS = 24 * 60 * 60 * 1000

export const getGraceEndsAt = (pastDueSince: Date) =>
  addDays(pastDueSince, GRACE_DAYS)

export const getBillingState = (shop: BillingShop, now: Date): BillingState => {
  switch (shop.subscriptionStatus) {
    case "ACTIVE":
      return { hasAccess: true, reason: "ACTIVE" }

    case "TRIALING": {
      const { trialEndsAt } = shop
      if (!trialEndsAt || trialEndsAt.getTime() <= now.getTime()) {
        return { hasAccess: false, reason: "TRIAL_ENDED" }
      }
      return {
        hasAccess: true,
        reason: "TRIALING",
        trialDaysLeft: Math.ceil(
          (trialEndsAt.getTime() - now.getTime()) / DAY_MS,
        ),
      }
    }

    case "PAST_DUE": {
      if (!shop.pastDueSince) {
        return { hasAccess: false, reason: "PAST_DUE_EXPIRED" }
      }
      const graceEndsAt = getGraceEndsAt(shop.pastDueSince)
      return graceEndsAt.getTime() > now.getTime()
        ? { hasAccess: true, reason: "PAST_DUE_GRACE", graceEndsAt }
        : { hasAccess: false, reason: "PAST_DUE_EXPIRED", graceEndsAt }
    }

    case "CANCELED":
      return { hasAccess: false, reason: "CANCELED" }

    default:
      // A status added to the enum later fails closed until it is handled here
      return { hasAccess: false, reason: "CANCELED" }
  }
}

// The same rule as a Prisma where, for list queries (the landing finder).
// pastDueSince + GRACE_DAYS > now  <=>  pastDueSince > now - GRACE_DAYS
export const billingActiveWhere = (now: Date): Prisma.BarbershopWhereInput => ({
  OR: [
    { subscriptionStatus: "ACTIVE" },
    { subscriptionStatus: "TRIALING", trialEndsAt: { gt: now } },
    {
      subscriptionStatus: "PAST_DUE",
      pastDueSince: { gt: addDays(now, -GRACE_DAYS) },
    },
  ],
})
