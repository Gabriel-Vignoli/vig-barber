import type Stripe from "stripe"
import { getStripe } from "@/app/_lib/stripe"

// Stripe webhook endpoint (stub). Public on purpose: proxy.ts never runs on
// /api, and the Stripe signature is the only authentication. The signature is
// computed over the raw body, so it is read with text() and never parsed
// before constructEvent verifies it.
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

  console.info(`[stripe] webhook received: ${event.type}`)

  // TODO(billing): sync the Barbershop subscription fields (plan,
  // subscriptionStatus, stripeCustomerId, stripeSubscriptionId, trialEndsAt)
  // from customer.subscription.* and invoice.* events. Look the shop up by
  // stripeCustomerId (never by an id taken from event metadata alone), and
  // make the handler idempotent: Stripe retries and may deliver twice.

  return Response.json({ received: true })
}
