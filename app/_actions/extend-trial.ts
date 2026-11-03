"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "../_lib/prisma"
import { assertPlatformAdmin } from "../_lib/platform-admin"
import { revalidateShop } from "../_lib/revalidate"
import { hasLiveSubscription } from "../_lib/billing"
import { addDays } from "../_lib/plans"
import { extendTrialSchema } from "../_lib/validations/platform"
import { action, ActionError } from "../_lib/action-result"

const shopIdSchema = z.string().min(1, "Barbearia inválida.")

// Platform only: gives a shop more days of the DB trial (comped shops, demos,
// restarting the trials at go-live). The new end is max(now, trialEndsAt) +
// days, so an ended trial restarts from today and a running one is extended.
//
// - A shop with a live Stripe subscription (ACTIVE, TRIALING or PAST_DUE in
//   Stripe) is refused: Stripe owns its status and the next webhook would
//   overwrite the trial. Comp those in the Stripe dashboard instead.
// - A shop whose subscription ended (CANCELED) goes back to TRIALING and the
//   ended subscription id is dropped (stripeCustomerId is kept). Otherwise
//   hasLiveSubscription would see TRIALING + an id and block a new checkout;
//   stripe-sync ignores the old subscription once it is no longer stored.
export const extendTrial = action(async (shopId: string, days: number) => {
  await assertPlatformAdmin()

  const parsedId = shopIdSchema.safeParse(shopId)
  const parsed = extendTrialSchema.safeParse({ days })

  if (!parsedId.success) {
    throw new ActionError(parsedId.error.issues[0].message)
  }

  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0].message)
  }

  const shop = await prisma.barbershop.findUnique({
    where: { id: parsedId.data },
    select: {
      id: true,
      slug: true,
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      trialEndsAt: true,
      updatedAt: true,
    },
  })

  if (!shop) {
    throw new ActionError("Barbearia não encontrada.")
  }

  if (hasLiveSubscription(shop)) {
    throw new ActionError(
      "Esta barbearia tem uma assinatura ativa no Stripe. Ajuste pelo painel do Stripe.",
    )
  }

  const now = new Date()
  const from =
    shop.trialEndsAt && shop.trialEndsAt.getTime() > now.getTime()
      ? shop.trialEndsAt
      : now
  const trialEndsAt = addDays(from, parsed.data.days)

  // Compare-and-set on updatedAt: a webhook that wrote a live subscription in
  // between makes this fail instead of overwriting it
  const { count } = await prisma.barbershop.updateMany({
    where: { id: shop.id, updatedAt: shop.updatedAt },
    data: {
      subscriptionStatus: "TRIALING",
      trialEndsAt,
      pastDueSince: null,
      ...(shop.stripeSubscriptionId && {
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
      }),
    },
  })

  if (count !== 1) {
    throw new ActionError(
      "A barbearia foi alterada durante a operação. Tente novamente.",
    )
  }

  revalidateShop(shop)
  revalidatePath("/platform")

  return { trialEndsAt }
})
