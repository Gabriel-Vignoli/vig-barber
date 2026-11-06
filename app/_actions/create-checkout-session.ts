"use server"

import type Stripe from "stripe"
import { prisma } from "../_lib/prisma"
import { assertShopRole, getBillingPath, type Tenant } from "../_lib/tenant"
import { getStripe } from "../_lib/stripe"
import { DEFAULT_PLAN, getStripePriceId, isPlanKey } from "../_lib/plans"
import { hasLiveSubscription } from "../_lib/billing"
import { getAppOrigin } from "../_lib/app-url"
import { action, ActionError } from "../_lib/action-result"
import { LEGAL_VERSION } from "../_constants/legal-entity"

const HOUR_MS = 60 * 60 * 1000

// Stripe subscription statuses that still bill (or are about to bill) the
// customer: a new checkout is refused while any of them exists
const BLOCKING_STRIPE_STATUSES: Stripe.Subscription.Status[] = [
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "paused",
]

// Stripe requires subscription_data.trial_end at least 48 h in the future.
// The extra minutes cover the time between this check and Stripe receiving
// the request, so a trial right at the limit is dropped instead of failing.
const MIN_TRIAL_CARRY_MS = 48 * HOUR_MS + 10 * 60 * 1000

// The shop's Stripe customer, created on the first checkout. It is saved
// before the admin ever reaches Stripe, so the webhook can find the shop by
// customer id. Two concurrent clicks may both create one; only the first save
// wins (stripeCustomerId: null in the where), and the loser uses the stored
// id and deletes its own customer.
const getOrCreateCustomerId = async (
  stripe: Stripe,
  shop: Tenant,
  slug: string,
  userId: string,
  storedCustomerId: string | null,
): Promise<string> => {
  if (storedCustomerId) return storedCustomerId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  const customer = await stripe.customers.create(
    {
      name: shop.name,
      email: user?.email ?? undefined,
      metadata: { barbershopId: shop.id, slug },
    },
    // A double click by the same admin gets the same customer back
    { idempotencyKey: `barbershop-customer:${shop.id}:${userId}` },
  )

  const { count } = await prisma.barbershop.updateMany({
    where: { id: shop.id, stripeCustomerId: null },
    data: { stripeCustomerId: customer.id },
  })

  if (count === 1) return customer.id

  const current = await prisma.barbershop.findUnique({
    where: { id: shop.id },
    select: { stripeCustomerId: true },
  })

  if (!current?.stripeCustomerId) {
    throw new Error(`Could not save the Stripe customer of shop ${shop.id}`)
  }

  if (current.stripeCustomerId !== customer.id) {
    try {
      await stripe.customers.del(customer.id)
    } catch (error) {
      console.error(error)
    }
  }

  return current.stripeCustomerId
}

// Opens a Stripe Checkout Session for the shop's subscription. The price id
// comes from the server env (plans.ts), never from the client, and the shop
// from the slug through the ADMIN check. allowUnpaid: an unpaid shop's admin
// must be able to pay. The success redirect grants nothing; only the webhook
// changes the subscription status.
export const createCheckoutSession = action(
  async (slug: string, acceptTerms: boolean) => {
    const { shop, userId } = await assertShopRole(slug, ["ADMIN"], {
      allowUnpaid: true,
    })

    if (acceptTerms !== true) {
      throw new ActionError(
        "Você precisa aceitar os termos de uso e a política de reembolso.",
      )
    }

    const stripe = getStripe()

    const billing = await prisma.barbershop.findUnique({
      where: { id: shop.id },
      select: {
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    })

    if (!billing) {
      throw new ActionError("Barbearia não encontrada.")
    }

    const plan = isPlanKey(billing.plan) ? billing.plan : DEFAULT_PLAN
    const priceId = getStripePriceId(plan)

    if (!stripe || !priceId) {
      throw new ActionError("Pagamentos ainda não estão configurados.")
    }

    if (hasLiveSubscription(billing)) {
      throw new ActionError(
        "Esta barbearia já tem uma assinatura. Use “Gerenciar assinatura”.",
      )
    }

    // Our DB only learns about a new subscription from the webhook, so right
    // after a checkout (or from a second tab) it may still say "no
    // subscription". Ask Stripe too, so the same customer is never charged twice.
    if (billing.stripeCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: billing.stripeCustomerId,
        status: "all",
        limit: 10,
      })

      if (
        subscriptions.data.some((subscription) =>
          BLOCKING_STRIPE_STATUSES.includes(subscription.status),
        )
      ) {
        throw new ActionError(
          "Esta barbearia já tem uma assinatura. Use “Gerenciar assinatura”.",
        )
      }
    }

    const customerId = await getOrCreateCustomerId(
      stripe,
      shop,
      slug,
      userId,
      billing.stripeCustomerId,
    )

    // Keeps the rest of the free trial: the first charge happens when it ends
    const trialEnd =
      billing.subscriptionStatus === "TRIALING" &&
      billing.trialEndsAt &&
      billing.trialEndsAt.getTime() - Date.now() >= MIN_TRIAL_CARRY_MS
        ? Math.floor(billing.trialEndsAt.getTime() / 1000)
        : undefined

    const billingUrl = `${await getAppOrigin()}${getBillingPath(slug)}`
    const metadata = { barbershopId: shop.id, slug }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: shop.id,
      metadata,
      subscription_data: {
        metadata,
        ...(trialEnd !== undefined && { trial_end: trialEnd }),
      },
      locale: "pt-BR",
      success_url: `${billingUrl}?checkout=success`,
      cancel_url: `${billingUrl}?checkout=cancel`,
    })

    if (!session.url) {
      throw new Error(`Checkout session ${session.id} has no URL`)
    }

    // Recorded here and not earlier: only an offer the admin can really open
    // counts as accepted
    await prisma.consent.create({
      data: {
        userId,
        barbershopId: shop.id,
        context: "CHECKOUT",
        version: LEGAL_VERSION,
      },
    })

    return { url: session.url }
  },
)
