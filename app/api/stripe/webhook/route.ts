import type Stripe from "stripe"
import { getStripe } from "@/app/_lib/stripe"
import {
  getStripeId,
  syncSubscription,
  type SyncRequest,
} from "@/app/_lib/stripe-sync"

type StripeRef = Parameters<typeof getStripeId>[0]

const buildRequest = (
  subscription: StripeRef,
  customer: StripeRef,
  claimedShopIds: SyncRequest["claimedShopIds"] = [],
): SyncRequest | null => {
  const subscriptionId = getStripeId(subscription)
  const customerId = getStripeId(customer)
  return subscriptionId && customerId
    ? { subscriptionId, customerId, claimedShopIds }
    : null
}

// Which subscription an event is about, and the customer it names (used only
// to pick the shop snapshot; the sync checks it against Stripe's fresh
// subscription). null = an event we don't sync.
const getSyncRequest = (event: Stripe.Event): SyncRequest | null => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      if (session.mode !== "subscription") return null
      // Both claims are cross-checked against the customer's shop
      return buildRequest(session.subscription, session.customer, [
        session.client_reference_id,
        session.metadata?.barbershopId,
      ])
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return buildRequest(event.data.object.id, event.data.object.customer)

    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object
      // API ≥ 2025-03: the invoice's subscription lives under parent
      return buildRequest(
        invoice.parent?.subscription_details?.subscription,
        invoice.customer,
      )
    }

    default:
      return null
  }
}

// Stripe webhook endpoint. Public on purpose: proxy.ts never runs on /api,
// and the Stripe signature is the only authentication. The signature is
// computed over the raw body, so it is read with text() and never parsed
// before constructEvent verifies it.
//
// Every handled event syncs the shop from a fresh read of the subscription
// (app/_lib/stripe-sync.ts), so retries, duplicates and late events are safe.
// Events that can never succeed (unknown customer, shop mismatch) answer 200
// so Stripe stops retrying; unexpected errors answer 500 so it retries.
export async function POST(request: Request) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !webhookSecret) {
    return Response.json(
      { error: "Pagamentos não configurados." },
      { status: 503 },
    )
  }

  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return Response.json({ error: "Assinatura ausente." }, { status: 400 })
  }

  const payload = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch {
    return Response.json({ error: "Assinatura inválida." }, { status: 400 })
  }

  console.info(`[stripe] webhook received: ${event.type} (${event.id})`)

  const ref = getSyncRequest(event)

  if (!ref) {
    return Response.json({ received: true })
  }

  try {
    const result = await syncSubscription(stripe, ref)
    return Response.json({ received: true, result })
  } catch (error) {
    console.error(
      `[stripe] failed to sync ${ref.subscriptionId} from ${event.type} (${event.id})`,
      error instanceof Error ? error.message : error,
    )
    return Response.json(
      { error: "Erro ao processar o evento." },
      { status: 500 },
    )
  }
}
