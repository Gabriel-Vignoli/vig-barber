import { vi } from "vitest"
import type Stripe from "stripe"

type Created = { id: string; url?: string }

// A fake Stripe client for the billing actions. Tests mock getStripe() with
// it (vi.mock("@/app/_lib/stripe")), so nothing ever reaches the network.
export const createStripeMock = () => {
  let customerCount = 0

  return {
    customers: {
      create: vi.fn<
        (
          params: Stripe.CustomerCreateParams,
          options?: Stripe.RequestOptions,
        ) => Promise<Created>
      >(async () => ({ id: `cus_test_${++customerCount}` })),
      del: vi.fn(async (id: string) => ({ id, deleted: true })),
    },
    // No subscriptions by default; tests set data with mockResolvedValue
    subscriptions: {
      list: vi.fn<
        (params: Stripe.SubscriptionListParams) => Promise<{
          data: { id: string; status: Stripe.Subscription.Status }[]
        }>
      >(async () => ({ data: [] })),
    },
    checkout: {
      sessions: {
        create: vi.fn<
          (params: Stripe.Checkout.SessionCreateParams) => Promise<Created>
        >(async () => ({
          id: "cs_test_1",
          url: "https://checkout.stripe.com/c/pay/cs_test_1",
        })),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn<
          (params: Stripe.BillingPortal.SessionCreateParams) => Promise<Created>
        >(async () => ({
          id: "bps_test_1",
          url: "https://billing.stripe.com/p/session/test_1",
        })),
      },
    },
  }
}

export type StripeMock = ReturnType<typeof createStripeMock>

export type FakeSubscriptionInput = {
  id: string
  customer: string
  status: Stripe.Subscription.Status
  priceId?: string
  // Unix seconds, like Stripe
  currentPeriodEnd?: number
  trialEnd?: number | null
  metadata?: Record<string, string>
}

// The fields of a Stripe.Subscription that the webhook sync reads. The period
// lives on the item (API >= 2025-03), not on the subscription.
export const fakeSubscription = ({
  id,
  customer,
  status,
  priceId = "price_basic_from_env",
  currentPeriodEnd = 1_800_000_000,
  trialEnd = null,
  metadata = {},
}: FakeSubscriptionInput) =>
  ({
    id,
    object: "subscription",
    customer,
    status,
    trial_end: trialEnd,
    metadata,
    items: {
      object: "list",
      data: [
        {
          id: `si_${id}`,
          object: "subscription_item",
          current_period_end: currentPeriodEnd,
          price: { id: priceId, object: "price" },
        },
      ],
    },
  }) as unknown as Stripe.Subscription
