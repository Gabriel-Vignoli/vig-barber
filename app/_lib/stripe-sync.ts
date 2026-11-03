import Stripe from "stripe"
import type { SubscriptionStatus } from "@/app/generated/prisma/enums"
import { prisma } from "./prisma"
import { getPlanByStripePriceId } from "./plans"
import { expireShopCache } from "./revalidate"

// Webhook → DB sync for a shop's Stripe subscription.
//
// Order-safe and idempotent by construction: every event only tells us WHICH
// subscription changed. Its current state is always retrieved fresh from
// Stripe, so a duplicate delivery writes the same values again (and is
// skipped as "unchanged"), and an old event delivered late writes today's
// state, never the state at the time of the event.
//
// Stale snapshots: the shop row is read BEFORE Stripe is asked, and the write
// only applies if the row is still exactly that snapshot (updatedAt plus every
// synced field). Any write that landed in between came from a later (fresher)
// read, so this one fails, answers 500, and Stripe's retry reads both again.
//
// The shop is found by stripeCustomerId (saved by create-checkout-session
// before the admin ever reaches Stripe). The event's customer only picks the
// snapshot; the subscription Stripe returns must belong to that same customer.
// Metadata and client_reference_id are only a cross-check: on a mismatch
// nothing is written.
//
// Several subscriptions per customer (a cancel and a new checkout, or an old
// test subscription): the shop tracks ONE, its stored stripeSubscriptionId.
// - The stored subscription always syncs. When it has ended, a live
//   subscription of the same customer (if any) takes its place.
// - Another subscription that has ended (canceled, incomplete_expired) never
//   writes: it can't cancel a live subscription or end a DB trial.
// - Another subscription that is not confirmed yet (incomplete, paused, or a
//   status we don't know) is ignored until it becomes live.
// - Another LIVE subscription (trialing, active, past_due, unpaid) replaces
//   the stored one only when the stored one is gone or has ended in Stripe
//   (re-read fresh, not from our DB). Two live ones at once are logged and the
//   stored one is kept: checkout refuses a second one, so it needs a human.

export type SyncResult =
  | "updated"
  | "unchanged"
  | "unknown-customer"
  | "metadata-mismatch"
  | "ignored-other-subscription"
  | "subscription-not-found"

export type SyncRequest = {
  subscriptionId: string
  // The customer the event names: only used to pick the shop snapshot
  customerId: string
  // Shop ids the event claims (checkout's client_reference_id, metadata)
  claimedShopIds?: (string | null | undefined)[]
}

type StripeGroup = "live" | "ended" | "pending"

const STATUS_MAP: Partial<
  Record<Stripe.Subscription.Status, SubscriptionStatus>
> = {
  trialing: "TRIALING",
  active: "ACTIVE",
  past_due: "PAST_DUE",
  unpaid: "PAST_DUE",
  canceled: "CANCELED",
  incomplete_expired: "CANCELED",
  // incomplete, paused: payment not confirmed yet, the status stays unchanged
}

const getGroup = (status: Stripe.Subscription.Status): StripeGroup => {
  switch (STATUS_MAP[status]) {
    case "TRIALING":
    case "ACTIVE":
    case "PAST_DUE":
      return "live"
    case "CANCELED":
      return "ended"
    default:
      return "pending"
  }
}

export const getStripeId = (
  value: string | { id: string } | null | undefined,
) => (typeof value === "string" ? value : (value?.id ?? null))

const fromUnix = (seconds: number | null | undefined) =>
  typeof seconds === "number" ? new Date(seconds * 1000) : null

const isMissing = (error: unknown) =>
  error instanceof Stripe.errors.StripeError &&
  error.code === "resource_missing"

// null when Stripe says the subscription does not exist
const retrieveSubscription = async (
  stripe: Stripe,
  subscriptionId: string,
): Promise<Stripe.Subscription | null> => {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId)
  } catch (error) {
    if (isMissing(error)) return null
    throw error
  }
}

// A live subscription of the customer, newest first (Stripe's list order)
const findLiveSubscription = async (stripe: Stripe, customerId: string) => {
  const { data } = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  })
  return data.find((subscription) => getGroup(subscription.status) === "live")
}

const sameTime = (a: Date | null, b: Date | null) =>
  (a?.getTime() ?? null) === (b?.getTime() ?? null)

// A cache error must not turn a committed write into a 500 (Stripe would
// retry an event that already took effect)
const expireCacheSafely = (shop: { id: string; slug: string }) => {
  try {
    expireShopCache(shop)
  } catch (error) {
    console.error(
      `[stripe] could not expire the cache of shop ${shop.id}`,
      error instanceof Error ? error.message : error,
    )
  }
}

export const syncSubscription = async (
  stripe: Stripe,
  { subscriptionId, customerId, claimedShopIds = [] }: SyncRequest,
  now = new Date(),
): Promise<SyncResult> => {
  // Snapshot first, Stripe second (see "Stale snapshots" above)
  const shop = await prisma.barbershop.findUnique({
    where: { stripeCustomerId: customerId },
    select: {
      id: true,
      slug: true,
      plan: true,
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      trialEndsAt: true,
      pastDueSince: true,
      currentPeriodEnd: true,
      updatedAt: true,
    },
  })

  if (!shop) {
    console.warn(
      `[stripe] no shop for customer ${customerId} (subscription ${subscriptionId})`,
    )
    return "unknown-customer"
  }

  let subscription = await retrieveSubscription(stripe, subscriptionId)

  if (!subscription) {
    console.warn(`[stripe] subscription ${subscriptionId} not found`)
    return "subscription-not-found"
  }

  // The shop identity comes from Stripe's fresh object, not from the event
  const actualCustomerId = getStripeId(subscription.customer)
  if (actualCustomerId !== customerId) {
    console.error(
      `[stripe] subscription ${subscription.id} belongs to customer ${actualCustomerId}, the event names ${customerId}`,
    )
    return "metadata-mismatch"
  }

  const claims = claimedShopIds.filter((id): id is string => Boolean(id))
  const hasMismatch = (candidate: Stripe.Subscription) => {
    const ids = [...claims, candidate.metadata?.barbershopId].filter(
      (id): id is string => Boolean(id),
    )
    const mismatch = ids.some((id) => id !== shop.id)
    if (mismatch) {
      console.error(
        `[stripe] shop mismatch for subscription ${candidate.id}: customer ${customerId} belongs to shop ${shop.id}, the event claims ${ids.join(", ")}`,
      )
    }
    return mismatch
  }

  if (hasMismatch(subscription)) return "metadata-mismatch"

  const isStored = shop.stripeSubscriptionId === subscription.id

  if (!isStored) {
    if (getGroup(subscription.status) !== "live") {
      console.info(
        `[stripe] ignoring ${subscription.status} subscription ${subscription.id} of shop ${shop.id} (stored: ${shop.stripeSubscriptionId ?? "none"})`,
      )
      return "ignored-other-subscription"
    }

    if (shop.stripeSubscriptionId) {
      const stored = await retrieveSubscription(
        stripe,
        shop.stripeSubscriptionId,
      )

      if (stored && getGroup(stored.status) !== "ended") {
        console.error(
          `[stripe] shop ${shop.id} has two subscriptions: keeping ${stored.id} (${stored.status}), ignoring ${subscription.id} (${subscription.status})`,
        )
        return "ignored-other-subscription"
      }
    }
  } else if (getGroup(subscription.status) === "ended") {
    // The stored one ended: a newer live subscription takes its place
    const live = await findLiveSubscription(stripe, customerId)
    if (live && live.id !== subscription.id) {
      if (getStripeId(live.customer) !== customerId || hasMismatch(live)) {
        return "metadata-mismatch"
      }
      console.info(
        `[stripe] shop ${shop.id}: stored subscription ${subscription.id} ended, adopting ${live.id}`,
      )
      subscription = live
    }
  }

  const mappedStatus = STATUS_MAP[subscription.status]
  if (!mappedStatus) {
    console.info(
      `[stripe] subscription ${subscription.id} is ${subscription.status}: status unchanged`,
    )
  }
  const subscriptionStatus = mappedStatus ?? shop.subscriptionStatus

  // We only ever create one item per subscription
  const item = subscription.items.data[0]
  const priceId = item?.price?.id
  const plan = priceId ? getPlanByStripePriceId(priceId) : null
  if (priceId && !plan) {
    console.warn(
      `[stripe] unknown price ${priceId} on subscription ${subscription.id}: plan unchanged`,
    )
  }

  // pastDueSince marks the start of the grace period: set when entering
  // PAST_DUE, kept while it stays there, cleared when it leaves
  const pastDueSince =
    subscriptionStatus === "PAST_DUE"
      ? shop.subscriptionStatus === "PAST_DUE" && shop.pastDueSince
        ? shop.pastDueSince
        : now
      : null

  const next = {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus,
    plan: plan ?? shop.plan,
    currentPeriodEnd:
      fromUnix(item?.current_period_end) ?? shop.currentPeriodEnd,
    trialEndsAt: fromUnix(subscription.trial_end) ?? shop.trialEndsAt,
    pastDueSince,
  }

  const unchanged =
    next.stripeSubscriptionId === shop.stripeSubscriptionId &&
    next.subscriptionStatus === shop.subscriptionStatus &&
    next.plan === shop.plan &&
    sameTime(next.currentPeriodEnd, shop.currentPeriodEnd) &&
    sameTime(next.trialEndsAt, shop.trialEndsAt) &&
    sameTime(next.pastDueSince, shop.pastDueSince)

  if (unchanged) {
    // A retry after a cache error lands here: expire again to be safe
    expireCacheSafely(shop)
    return "unchanged"
  }

  // Compare-and-set on the snapshot read before Stripe was asked: updatedAt
  // catches any write in between, and the fields cover two writes in the
  // same millisecond. Nothing matches → throw → 500 → Stripe retries.
  const { count } = await prisma.barbershop.updateMany({
    where: {
      id: shop.id,
      stripeCustomerId: customerId,
      updatedAt: shop.updatedAt,
      stripeSubscriptionId: shop.stripeSubscriptionId,
      subscriptionStatus: shop.subscriptionStatus,
      plan: shop.plan,
      currentPeriodEnd: shop.currentPeriodEnd,
      trialEndsAt: shop.trialEndsAt,
      pastDueSince: shop.pastDueSince,
    },
    data: next,
  })

  if (count !== 1) {
    throw new Error(
      `Shop ${shop.id} changed while syncing subscription ${subscription.id}`,
    )
  }

  console.info(
    `[stripe] shop ${shop.id}: subscription ${subscription.id} is ${subscription.status} (${subscriptionStatus})`,
  )

  expireCacheSafely(shop)

  return "updated"
}
