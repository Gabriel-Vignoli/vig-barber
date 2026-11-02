"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole, getBillingPath } from "../_lib/tenant"
import { getStripe } from "../_lib/stripe"
import { getAppOrigin } from "../_lib/app-url"
import { action, ActionError } from "../_lib/action-result"

// Opens the Stripe Customer Portal (card, cancellation, invoices) for the
// shop's own customer. The customer id is read from the DB by the shop that
// the ADMIN check resolved from the slug, never taken from the client.
export const createPortalSession = action(async (slug: string) => {
  const { shop } = await assertShopRole(slug, ["ADMIN"], {
    allowUnpaid: true,
  })

  const stripe = getStripe()

  if (!stripe) {
    throw new ActionError("Pagamentos ainda não estão configurados.")
  }

  const billing = await prisma.barbershop.findUnique({
    where: { id: shop.id },
    select: { stripeCustomerId: true },
  })

  if (!billing?.stripeCustomerId) {
    throw new ActionError(
      "Esta barbearia ainda não tem uma assinatura. Use “Assinar”.",
    )
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: `${await getAppOrigin()}${getBillingPath(slug)}`,
  })

  return { url: session.url }
})
