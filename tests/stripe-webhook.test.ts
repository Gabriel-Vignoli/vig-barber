import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import Stripe from "stripe"
import { revalidatePath, revalidateTag } from "next/cache"
import { POST } from "@/app/api/stripe/webhook/route"
import { isProtectedPath } from "@/app/_lib/protected-paths"
import { config as proxyConfig } from "@/proxy"
import { prisma } from "@/app/_lib/prisma"
import { getStripe } from "@/app/_lib/stripe"
import {
  assertShopRole,
  BILLING_PENDING_MESSAGE,
  getTenant,
  shopHasAccess,
  shopSlugTag,
  shopTag,
} from "@/app/_lib/tenant"
import type { SubscriptionStatus } from "@/app/generated/prisma/enums"
import { createMembership, createShop, createUser } from "./helpers/factories"
import { mockSession } from "./helpers/session"
import { fakeSubscription, type FakeSubscriptionInput } from "./helpers/stripe"

// The real SDK verifies the signatures; only subscriptions.retrieve is fake,
// so nothing reaches the network
vi.mock("@/app/_lib/stripe", () => ({ getStripe: vi.fn() }))

const WEBHOOK_SECRET = "whsec_test_secret"
const WEBHOOK_URL = "http://localhost:3000/api/stripe/webhook"
const PRICE_BASIC = "price_basic_from_env"
const CUSTOMER = "cus_shop_a"
const PERIOD_END = 1_800_000_000

// Stripe's side of the world: the subscriptions retrieve() returns
const stripeSubscriptions = new Map<string, Stripe.Subscription>()

const retrieve = vi.fn(async (id: string) => {
  const subscription = stripeSubscriptions.get(id)
  if (!subscription) {
    throw new Stripe.errors.StripeInvalidRequestError({
      message: `No such subscription: '${id}'`,
      code: "resource_missing",
      type: "invalid_request_error",
    })
  }
  return subscription
})

const realStripe = new Stripe("sk_test_dummy")
// Stripe lists newest first
const list = vi.fn(async ({ customer }: { customer: string }) => ({
  data: [...stripeSubscriptions.values()]
    .reverse()
    .filter((subscription) => subscription.customer === customer),
}))

const fakeStripe = {
  webhooks: realStripe.webhooks,
  subscriptions: { retrieve, list },
}

const setStripeSubscription = (
  input: Partial<FakeSubscriptionInput> & Pick<FakeSubscriptionInput, "id">,
) =>
  stripeSubscriptions.set(
    input.id,
    fakeSubscription({ customer: CUSTOMER, status: "active", ...input }),
  )

let eventCount = 0

const eventPayload = (type: string, object: Record<string, unknown>) =>
  JSON.stringify({
    id: `evt_test_${++eventCount}`,
    object: "event",
    type,
    data: { object },
  })

const subscriptionEvent = (
  type: string,
  id: string,
  // What the payload says; the sync ignores it and re-reads the subscription
  extra: Record<string, unknown> = {},
) =>
  eventPayload(type, {
    id,
    object: "subscription",
    customer: CUSTOMER,
    ...extra,
  })

const invoiceEvent = (
  type: string,
  subscriptionId: string,
  customer = CUSTOMER,
) =>
  eventPayload(type, {
    id: "in_test_1",
    object: "invoice",
    customer,
    parent: {
      type: "subscription_details",
      quote_details: null,
      subscription_details: { subscription: subscriptionId, metadata: {} },
    },
  })

const checkoutEvent = (
  subscriptionId: string,
  claims: { clientReferenceId?: string; barbershopId?: string } = {},
) =>
  eventPayload("checkout.session.completed", {
    id: "cs_test_1",
    object: "checkout.session",
    mode: "subscription",
    customer: CUSTOMER,
    subscription: subscriptionId,
    client_reference_id: claims.clientReferenceId ?? null,
    metadata: claims.barbershopId ? { barbershopId: claims.barbershopId } : {},
  })

const sign = (payload: string, secret = WEBHOOK_SECRET) =>
  Stripe.webhooks.generateTestHeaderString({ payload, secret })

const webhookRequest = (payload: string, signature?: string) =>
  new Request(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(signature && { "stripe-signature": signature }),
    },
    body: payload,
  })

const send = async (payload: string) => {
  const response = await POST(webhookRequest(payload, sign(payload)))
  return { status: response.status, body: await response.json() }
}

const billingSelect = {
  plan: true,
  subscriptionStatus: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  trialEndsAt: true,
  pastDueSince: true,
  currentPeriodEnd: true,
} as const

type Shop = Awaited<ReturnType<typeof createShop>>

let shop: Shop

const readBilling = (id = shop.id) =>
  prisma.barbershop.findUniqueOrThrow({ where: { id }, select: billingSelect })

const setBilling = (data: {
  subscriptionStatus?: SubscriptionStatus
  stripeSubscriptionId?: string | null
  trialEndsAt?: Date | null
  pastDueSince?: Date | null
  plan?: "BASIC" | "PRO"
}) => prisma.barbershop.update({ where: { id: shop.id }, data })

beforeEach(async () => {
  stripeSubscriptions.clear()
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy")
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET)
  vi.stubEnv("STRIPE_PRICE_BASIC", PRICE_BASIC)
  vi.mocked(getStripe).mockImplementation(() =>
    process.env.STRIPE_SECRET_KEY ? (fakeStripe as never) : null,
  )
  vi.spyOn(console, "info").mockImplementation(() => {})
  vi.spyOn(console, "warn").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})

  shop = await createShop({ slug: "barbearia-a" })
  await prisma.barbershop.update({
    where: { id: shop.id },
    data: { stripeCustomerId: CUSTOMER },
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe("Stripe webhook: request checks", () => {
  const PAYLOAD = subscriptionEvent("customer.subscription.updated", "sub_1")

  it.each(["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"])(
    "answers 503 while %s is unset",
    async (name) => {
      vi.stubEnv(name, "")

      const response = await POST(webhookRequest(PAYLOAD, sign(PAYLOAD)))

      expect(response.status).toBe(503)
    },
  )

  it("rejects a missing signature with 400", async () => {
    const response = await POST(webhookRequest(PAYLOAD))

    expect(response.status).toBe(400)
  })

  it("rejects a signature made with another secret with 400", async () => {
    const response = await POST(
      webhookRequest(PAYLOAD, sign(PAYLOAD, "whsec_other")),
    )

    expect(response.status).toBe(400)
    expect(retrieve).not.toHaveBeenCalled()
  })

  it("rejects a body changed after signing with 400", async () => {
    const tampered = PAYLOAD.replace("sub_1", "sub_2")

    const response = await POST(webhookRequest(tampered, sign(PAYLOAD)))

    expect(response.status).toBe(400)
    expect(retrieve).not.toHaveBeenCalled()
  })

  it("answers 200 to events it does not sync, without calling Stripe", async () => {
    const before = await readBilling()

    const { status, body } = await send(
      eventPayload("customer.created", { id: CUSTOMER, object: "customer" }),
    )

    expect(status).toBe(200)
    expect(body).toEqual({ received: true })
    expect(retrieve).not.toHaveBeenCalled()
    expect(await readBilling()).toEqual(before)
  })

  it("is never behind the session check of proxy.ts", () => {
    const [matcher] = proxyConfig.matcher
    const runsProxy = new RegExp(`^${matcher}$`)

    expect(runsProxy.test("/api/stripe/webhook")).toBe(false)
    expect(isProtectedPath("/api/stripe/webhook")).toBe(false)
    // Sanity check: the matcher does run on pages
    expect(runsProxy.test("/b/barbearia-a/admin")).toBe(true)
  })
})

describe("Stripe webhook: subscription sync", () => {
  it.each<[Stripe.Subscription.Status, SubscriptionStatus]>([
    ["trialing", "TRIALING"],
    ["active", "ACTIVE"],
    ["past_due", "PAST_DUE"],
    ["unpaid", "PAST_DUE"],
    ["canceled", "CANCELED"],
    ["incomplete_expired", "CANCELED"],
  ])("maps a %s subscription to %s", async (stripeStatus, expected) => {
    await setBilling({ stripeSubscriptionId: "sub_1" })
    setStripeSubscription({ id: "sub_1", status: stripeStatus })

    const { status, body } = await send(
      subscriptionEvent("customer.subscription.updated", "sub_1"),
    )

    expect(status).toBe(200)
    expect(body.result).toBe("updated")
    const billing = await readBilling()
    expect(billing).toMatchObject({
      subscriptionStatus: expected,
      stripeSubscriptionId: "sub_1",
      stripeCustomerId: CUSTOMER,
      plan: "BASIC",
      currentPeriodEnd: new Date(PERIOD_END * 1000),
    })
    expect(billing.pastDueSince === null).toBe(expected !== "PAST_DUE")
  })

  it.each<Stripe.Subscription.Status>(["incomplete", "paused"])(
    "leaves the status unchanged for a %s subscription",
    async (stripeStatus) => {
      await setBilling({
        stripeSubscriptionId: "sub_1",
        subscriptionStatus: "ACTIVE",
      })
      setStripeSubscription({
        id: "sub_1",
        status: stripeStatus,
        currentPeriodEnd: PERIOD_END + 100,
      })

      await send(subscriptionEvent("customer.subscription.updated", "sub_1"))

      expect(await readBilling()).toMatchObject({
        subscriptionStatus: "ACTIVE",
        currentPeriodEnd: new Date((PERIOD_END + 100) * 1000),
      })
    },
  )

  it("adopts the subscription of a completed checkout and keeps the carried trial", async () => {
    const trialEnd = Math.floor(Date.now() / 1000) + 10 * 24 * 60 * 60
    setStripeSubscription({
      id: "sub_new",
      status: "trialing",
      trialEnd,
      metadata: { barbershopId: shop.id, slug: "barbearia-a" },
    })

    const { status, body } = await send(
      checkoutEvent("sub_new", {
        clientReferenceId: shop.id,
        barbershopId: shop.id,
      }),
    )

    expect(status).toBe(200)
    expect(body.result).toBe("updated")
    expect(retrieve).toHaveBeenCalledWith("sub_new")
    expect(await readBilling()).toMatchObject({
      stripeSubscriptionId: "sub_new",
      subscriptionStatus: "TRIALING",
      trialEndsAt: new Date(trialEnd * 1000),
    })
  })

  it("expires the shop's cache tags right away after a write", async () => {
    setStripeSubscription({ id: "sub_new" })

    await send(checkoutEvent("sub_new", { clientReferenceId: shop.id }))

    expect(revalidateTag).toHaveBeenCalledWith(shopTag(shop.id), { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledWith(shopSlugTag("barbearia-a"), {
      expire: 0,
    })
    expect(revalidatePath).toHaveBeenCalledWith("/b/barbearia-a", "layout")
  })

  it("opens the billing gate as soon as the webhook writes", async () => {
    const admin = await createUser()
    await createMembership(admin.id, shop.id, "ADMIN")
    mockSession(admin.id)
    await setBilling({ trialEndsAt: new Date(Date.now() - 1000) })

    expect(shopHasAccess(await getTenant("barbearia-a"))).toBe(false)
    await expect(assertShopRole("barbearia-a", ["ADMIN"])).rejects.toThrow(
      BILLING_PENDING_MESSAGE,
    )

    setStripeSubscription({ id: "sub_new", status: "active" })
    await send(checkoutEvent("sub_new", { clientReferenceId: shop.id }))

    expect(shopHasAccess(await getTenant("barbearia-a"))).toBe(true)
    await expect(
      assertShopRole("barbearia-a", ["ADMIN"]),
    ).resolves.toMatchObject({ shop: { id: shop.id } })
  })

  it("syncs invoice.paid and invoice.payment_failed through the invoice's subscription", async () => {
    await setBilling({
      stripeSubscriptionId: "sub_1",
      subscriptionStatus: "ACTIVE",
    })

    setStripeSubscription({ id: "sub_1", status: "past_due" })
    await send(invoiceEvent("invoice.payment_failed", "sub_1"))
    expect((await readBilling()).subscriptionStatus).toBe("PAST_DUE")

    setStripeSubscription({ id: "sub_1", status: "active" })
    await send(invoiceEvent("invoice.paid", "sub_1"))
    expect((await readBilling()).subscriptionStatus).toBe("ACTIVE")
    expect(retrieve).toHaveBeenCalledTimes(2)
  })

  it("sets pastDueSince on entering PAST_DUE, keeps it while there and clears it on recovery", async () => {
    await setBilling({
      stripeSubscriptionId: "sub_1",
      subscriptionStatus: "ACTIVE",
    })

    const before = Date.now()
    setStripeSubscription({ id: "sub_1", status: "past_due" })
    await send(invoiceEvent("invoice.payment_failed", "sub_1"))

    const { pastDueSince } = await readBilling()
    expect(pastDueSince).not.toBeNull()
    expect(pastDueSince!.getTime()).toBeGreaterThanOrEqual(before - 1000)
    expect(pastDueSince!.getTime()).toBeLessThanOrEqual(Date.now() + 1000)

    // Another failed retry (and Stripe moving it to unpaid) keeps the start
    // of the grace period
    await new Promise((resolve) => setTimeout(resolve, 20))
    setStripeSubscription({
      id: "sub_1",
      status: "unpaid",
      currentPeriodEnd: PERIOD_END + 1,
    })
    await send(invoiceEvent("invoice.payment_failed", "sub_1"))
    expect(await readBilling()).toMatchObject({
      subscriptionStatus: "PAST_DUE",
      pastDueSince,
    })

    setStripeSubscription({ id: "sub_1", status: "active" })
    await send(invoiceEvent("invoice.paid", "sub_1"))
    expect(await readBilling()).toMatchObject({
      subscriptionStatus: "ACTIVE",
      pastDueSince: null,
    })
  })

  it("writes nothing on a duplicate delivery", async () => {
    await setBilling({ stripeSubscriptionId: "sub_1" })
    setStripeSubscription({ id: "sub_1", status: "active" })
    const payload = subscriptionEvent("customer.subscription.updated", "sub_1")

    const first = await send(payload)
    const after = await prisma.barbershop.findUniqueOrThrow({
      where: { id: shop.id },
    })
    vi.mocked(revalidateTag).mockClear()

    const second = await send(payload)

    expect(first.body.result).toBe("updated")
    expect(second).toEqual({
      status: 200,
      body: { received: true, result: "unchanged" },
    })
    expect(
      await prisma.barbershop.findUniqueOrThrow({ where: { id: shop.id } }),
    ).toEqual(after)
    // A retry after a cache error lands here, so the cache expires again
    expect(revalidateTag).toHaveBeenCalledWith(shopTag(shop.id), { expire: 0 })
  })

  it("ends CANCELED when an older update arrives after the deletion", async () => {
    await setBilling({
      stripeSubscriptionId: "sub_1",
      subscriptionStatus: "ACTIVE",
    })
    // Stripe's current state: canceled
    setStripeSubscription({ id: "sub_1", status: "canceled" })

    await send(
      subscriptionEvent("customer.subscription.deleted", "sub_1", {
        status: "canceled",
      }),
    )
    // Delivered late: the payload still says active
    await send(
      subscriptionEvent("customer.subscription.updated", "sub_1", {
        status: "active",
      }),
    )

    expect((await readBilling()).subscriptionStatus).toBe("CANCELED")
  })

  it("leaves the plan unchanged for an unknown price and still syncs the status", async () => {
    await setBilling({
      stripeSubscriptionId: "sub_1",
      subscriptionStatus: "TRIALING",
      plan: "PRO",
    })
    setStripeSubscription({
      id: "sub_1",
      status: "active",
      priceId: "price_archived",
    })

    await send(subscriptionEvent("customer.subscription.updated", "sub_1"))

    expect(await readBilling()).toMatchObject({
      plan: "PRO",
      subscriptionStatus: "ACTIVE",
    })
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("price_archived"),
    )
  })

  it("answers 200 and writes nothing for an unknown customer", async () => {
    const before = await readBilling()
    setStripeSubscription({
      id: "sub_x",
      customer: "cus_unknown",
      status: "active",
    })

    const { status, body } = await send(
      subscriptionEvent("customer.subscription.created", "sub_x", {
        customer: "cus_unknown",
      }),
    )

    expect(status).toBe(200)
    expect(body.result).toBe("unknown-customer")
    expect(await readBilling()).toEqual(before)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it("answers 200 and writes nothing for a subscription Stripe does not know", async () => {
    const before = await readBilling()

    const { status, body } = await send(
      subscriptionEvent("customer.subscription.updated", "sub_missing"),
    )

    expect(status).toBe(200)
    expect(body.result).toBe("subscription-not-found")
    expect(await readBilling()).toEqual(before)
  })

  it("only writes the shop that owns the customer", async () => {
    const other = await createShop({ slug: "barbearia-b" })
    await prisma.barbershop.update({
      where: { id: other.id },
      data: { stripeCustomerId: "cus_shop_b" },
    })
    const before = await readBilling()
    setStripeSubscription({
      id: "sub_b",
      customer: "cus_shop_b",
      status: "active",
    })

    await send(
      subscriptionEvent("customer.subscription.created", "sub_b", {
        customer: "cus_shop_b",
      }),
    )

    expect(await readBilling()).toEqual(before)
    expect(await readBilling(other.id)).toMatchObject({
      stripeSubscriptionId: "sub_b",
      subscriptionStatus: "ACTIVE",
    })
  })

  describe("refuses to write when the event claims another shop", () => {
    let otherShopId: string

    beforeEach(async () => {
      otherShopId = (await createShop({ slug: "barbearia-b" })).id
    })

    it("through the checkout's client_reference_id", async () => {
      const before = await readBilling()
      setStripeSubscription({ id: "sub_new" })

      const { status, body } = await send(
        checkoutEvent("sub_new", { clientReferenceId: otherShopId }),
      )

      expect(status).toBe(200)
      expect(body.result).toBe("metadata-mismatch")
      expect(await readBilling()).toEqual(before)
    })

    it("through the checkout's metadata", async () => {
      const before = await readBilling()
      setStripeSubscription({ id: "sub_new" })

      const { body } = await send(
        checkoutEvent("sub_new", { barbershopId: otherShopId }),
      )

      expect(body.result).toBe("metadata-mismatch")
      expect(await readBilling()).toEqual(before)
    })

    it("through the subscription's metadata", async () => {
      const before = await readBilling()
      setStripeSubscription({
        id: "sub_new",
        metadata: { barbershopId: otherShopId },
      })

      const { body } = await send(
        subscriptionEvent("customer.subscription.created", "sub_new"),
      )

      expect(body.result).toBe("metadata-mismatch")
      expect(await readBilling()).toEqual(before)
    })
  })

  describe("several subscriptions on one customer", () => {
    it("an old canceled subscription never overwrites the live one", async () => {
      await setBilling({
        stripeSubscriptionId: "sub_live",
        subscriptionStatus: "ACTIVE",
      })
      setStripeSubscription({ id: "sub_live", status: "active" })
      setStripeSubscription({
        id: "sub_old",
        status: "canceled",
        priceId: "price_archived",
      })

      const { body } = await send(
        subscriptionEvent("customer.subscription.deleted", "sub_old"),
      )

      expect(body.result).toBe("ignored-other-subscription")
      expect(await readBilling()).toMatchObject({
        stripeSubscriptionId: "sub_live",
        subscriptionStatus: "ACTIVE",
      })
    })

    it("an old canceled subscription does not end a trial with no subscription", async () => {
      const before = await readBilling()
      setStripeSubscription({ id: "sub_old", status: "canceled" })

      const { body } = await send(
        subscriptionEvent("customer.subscription.updated", "sub_old"),
      )

      expect(body.result).toBe("ignored-other-subscription")
      expect(await readBilling()).toEqual(before)
      expect(before.subscriptionStatus).toBe("TRIALING")
    })

    it("a new live subscription replaces one that has ended", async () => {
      await setBilling({
        stripeSubscriptionId: "sub_old",
        subscriptionStatus: "CANCELED",
      })
      setStripeSubscription({ id: "sub_old", status: "canceled" })
      setStripeSubscription({ id: "sub_new", status: "active" })

      await send(subscriptionEvent("customer.subscription.created", "sub_new"))

      expect(await readBilling()).toMatchObject({
        stripeSubscriptionId: "sub_new",
        subscriptionStatus: "ACTIVE",
      })
    })

    it("a new live subscription replaces one that ended in Stripe before our DB heard of it", async () => {
      // The deletion event of sub_old has not arrived yet
      await setBilling({
        stripeSubscriptionId: "sub_old",
        subscriptionStatus: "ACTIVE",
      })
      setStripeSubscription({ id: "sub_old", status: "canceled" })
      setStripeSubscription({ id: "sub_new", status: "active" })

      await send(subscriptionEvent("customer.subscription.created", "sub_new"))
      // ...and when it arrives it is ignored
      await send(subscriptionEvent("customer.subscription.deleted", "sub_old"))

      expect(await readBilling()).toMatchObject({
        stripeSubscriptionId: "sub_new",
        subscriptionStatus: "ACTIVE",
      })
    })

    it("keeps the stored subscription while it is still live in Stripe", async () => {
      await setBilling({
        stripeSubscriptionId: "sub_a",
        subscriptionStatus: "ACTIVE",
      })
      setStripeSubscription({ id: "sub_a", status: "active" })
      setStripeSubscription({ id: "sub_b", status: "active" })

      const { body } = await send(
        subscriptionEvent("customer.subscription.created", "sub_b"),
      )

      expect(body.result).toBe("ignored-other-subscription")
      expect((await readBilling()).stripeSubscriptionId).toBe("sub_a")
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("two subscriptions"),
      )
    })

    it("does not adopt a subscription whose payment is not confirmed yet", async () => {
      const before = await readBilling()
      setStripeSubscription({ id: "sub_new", status: "incomplete" })

      const { body } = await send(
        subscriptionEvent("customer.subscription.created", "sub_new"),
      )

      expect(body.result).toBe("ignored-other-subscription")
      expect(await readBilling()).toEqual(before)
    })
  })

  describe("a stale Stripe snapshot never rolls the shop back", () => {
    // retrieve() hands out `stale`, and while that request is "in flight"
    // Stripe moves on to `fresh` and another delivery syncs it
    const raceWith = (
      stale: Partial<FakeSubscriptionInput>,
      fresh: Partial<FakeSubscriptionInput>,
      freshEvent: string,
    ) => {
      retrieve.mockImplementationOnce(async (id: string) => {
        const snapshot = fakeSubscription({
          id,
          customer: CUSTOMER,
          status: "active",
          ...stale,
        })
        setStripeSubscription({ id, ...fresh })
        const other = await send(freshEvent)
        expect(other.body.result).toBe("updated")
        return snapshot
      })
    }

    beforeEach(async () => {
      await setBilling({
        stripeSubscriptionId: "sub_1",
        subscriptionStatus: "ACTIVE",
      })
      setStripeSubscription({ id: "sub_1", status: "active" })
    })

    it("a cancellation written in between is kept", async () => {
      raceWith(
        { status: "active" },
        { status: "canceled" },
        subscriptionEvent("customer.subscription.deleted", "sub_1"),
      )

      const slow = await send(
        subscriptionEvent("customer.subscription.updated", "sub_1"),
      )

      expect(slow.status).toBe(500)
      expect((await readBilling()).subscriptionStatus).toBe("CANCELED")

      // Stripe's retry reads the current state and changes nothing
      const retry = await send(
        subscriptionEvent("customer.subscription.updated", "sub_1"),
      )
      expect(retry.body.result).toBe("unchanged")
      expect((await readBilling()).subscriptionStatus).toBe("CANCELED")
    })

    it("a newer period end written in between is kept", async () => {
      raceWith(
        { status: "active", currentPeriodEnd: PERIOD_END },
        { status: "active", currentPeriodEnd: PERIOD_END + 2_592_000 },
        invoiceEvent("invoice.paid", "sub_1"),
      )

      const slow = await send(
        subscriptionEvent("customer.subscription.updated", "sub_1"),
      )

      expect(slow.status).toBe(500)
      expect(await readBilling()).toMatchObject({
        subscriptionStatus: "ACTIVE",
        currentPeriodEnd: new Date((PERIOD_END + 2_592_000) * 1000),
      })
    })
  })

  it("writes nothing when Stripe's subscription belongs to another customer than the event says", async () => {
    const before = await readBilling()
    setStripeSubscription({ id: "sub_x", customer: "cus_other" })

    const { status, body } = await send(
      subscriptionEvent("customer.subscription.created", "sub_x"),
    )

    expect(status).toBe(200)
    expect(body.result).toBe("metadata-mismatch")
    expect(await readBilling()).toEqual(before)
  })

  it("cross-checks both checkout claims (client_reference_id and metadata)", async () => {
    const other = await createShop({ slug: "barbearia-b" })
    const before = await readBilling()
    setStripeSubscription({ id: "sub_new" })

    const { body } = await send(
      checkoutEvent("sub_new", {
        clientReferenceId: shop.id,
        barbershopId: other.id,
      }),
    )

    expect(body.result).toBe("metadata-mismatch")
    expect(await readBilling()).toEqual(before)
  })

  it("adopts the customer's live subscription when the stored one ends", async () => {
    await setBilling({
      stripeSubscriptionId: "sub_old",
      subscriptionStatus: "ACTIVE",
    })
    setStripeSubscription({ id: "sub_old", status: "canceled" })
    setStripeSubscription({ id: "sub_new", status: "active" })

    await send(subscriptionEvent("customer.subscription.deleted", "sub_old"))

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ customer: CUSTOMER, status: "all" }),
    )
    expect(await readBilling()).toMatchObject({
      stripeSubscriptionId: "sub_new",
      subscriptionStatus: "ACTIVE",
    })
  })

  it("keeps a committed write when expiring the cache fails", async () => {
    await setBilling({ stripeSubscriptionId: "sub_1" })
    setStripeSubscription({ id: "sub_1", status: "active" })
    vi.mocked(revalidateTag).mockImplementationOnce(() => {
      throw new Error("cache down")
    })

    const { status, body } = await send(
      subscriptionEvent("customer.subscription.updated", "sub_1"),
    )

    expect(status).toBe(200)
    expect(body.result).toBe("updated")
    expect((await readBilling()).subscriptionStatus).toBe("ACTIVE")
  })

  it("answers 500 on an unexpected error so Stripe retries", async () => {
    retrieve.mockRejectedValueOnce(new Error("Stripe is down"))

    const { status } = await send(
      subscriptionEvent("customer.subscription.updated", "sub_1"),
    )

    expect(status).toBe(500)
  })

  it("never clears stripeCustomerId", async () => {
    await setBilling({ stripeSubscriptionId: "sub_1" })
    setStripeSubscription({ id: "sub_1", status: "canceled" })

    await send(subscriptionEvent("customer.subscription.deleted", "sub_1"))

    expect((await readBilling()).stripeCustomerId).toBe(CUSTOMER)
  })
})
