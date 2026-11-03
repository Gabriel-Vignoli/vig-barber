import type { Prisma } from "@/app/generated/prisma/client"
import type { SubscriptionStatus } from "@/app/generated/prisma/enums"
import { addDays, GRACE_DAYS } from "./plans"
import { formatBrazilDate } from "./timezone"

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

// Whether the shop already has a Stripe subscription that is still running
// (paid, trialing in Stripe, or retrying a failed payment). Checkout refuses
// a second subscription while this holds; a CANCELED one can subscribe again.
export const hasLiveSubscription = (shop: {
  stripeSubscriptionId: string | null
  subscriptionStatus: SubscriptionStatus
}) =>
  Boolean(shop.stripeSubscriptionId) &&
  (shop.subscriptionStatus === "ACTIVE" ||
    shop.subscriptionStatus === "TRIALING" ||
    shop.subscriptionStatus === "PAST_DUE")

// The billing column of the platform panel. Dates are shown in Brazil time.
export type BillingStatusLabel = {
  label: string
  variant: "secondary" | "success" | "destructive"
}

export const getBillingStatusLabel = (
  shop: BillingShop,
  now: Date,
): BillingStatusLabel => {
  switch (shop.subscriptionStatus) {
    case "TRIALING": {
      const { trialEndsAt } = shop
      if (!trialEndsAt)
        return { label: "Teste encerrado", variant: "destructive" }
      return trialEndsAt.getTime() > now.getTime()
        ? {
            label: `Teste até ${formatBrazilDate(trialEndsAt)}`,
            variant: "secondary",
          }
        : {
            label: `Teste encerrado em ${formatBrazilDate(trialEndsAt)}`,
            variant: "destructive",
          }
    }
    case "ACTIVE":
      return { label: "Ativa", variant: "success" }
    case "PAST_DUE":
      return { label: "Pagamento pendente", variant: "destructive" }
    default:
      return { label: "Cancelada", variant: "destructive" }
  }
}
