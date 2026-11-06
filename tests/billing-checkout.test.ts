import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "@/app/_lib/prisma"
import { LEGAL_VERSION } from "@/app/_constants/legal-entity"
import { getStripe } from "@/app/_lib/stripe"
import { unwrap } from "@/app/_lib/action-result"
import { hasLiveSubscription } from "@/app/_lib/billing"
import { createCheckoutSession } from "@/app/_actions/create-checkout-session"
import { createPortalSession } from "@/app/_actions/create-portal-session"
import type { SubscriptionStatus } from "@/app/generated/prisma/enums"
import { createMembership, createShop, createUser } from "./helpers/factories"
import { mockSession } from "./helpers/session"
import { createStripeMock, type StripeMock } from "./helpers/stripe"

vi.mock("@/app/_lib/stripe", () => ({ getStripe: vi.fn() }))

const HOUR_MS = 60 * 60 * 1000
const NOT_CONFIGURED = "Pagamentos ainda não estão configurados."
const ALREADY_SUBSCRIBED =
  "Esta barbearia já tem uma assinatura. Use “Gerenciar assinatura”."
const NO_CUSTOMER =
  "Esta barbearia ainda não tem uma assinatura. Use “Assinar”."
const BILLING_URL = "https://app.test/b/barbearia-a/admin/billing"

let stripe: StripeMock
let f: Awaited<ReturnType<typeof seed>>

const seed = async () => {
  const shop = await createShop({ slug: "barbearia-a", name: "Barbearia A" })
  const admin = await createUser({
    name: "Admin A",
    email: "admin-a@test.local",
  })
  await createMembership(admin.id, shop.id, "ADMIN")
  return { shop, admin }
}

const setBilling = (data: {
  subscriptionStatus?: SubscriptionStatus
  trialEndsAt?: Date | null
  pastDueSince?: Date | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}) => prisma.barbershop.update({ where: { id: f.shop.id }, data })

const readStripeIds = () =>
  prisma.barbershop.findUniqueOrThrow({
    where: { id: f.shop.id },
    select: { stripeCustomerId: true, stripeSubscriptionId: true },
  })

const lastCheckoutParams = () =>
  stripe.checkout.sessions.create.mock.lastCall![0]

beforeEach(async () => {
  f = await seed()
  mockSession(f.admin.id)
  stripe = createStripeMock()
  vi.mocked(getStripe).mockReturnValue(stripe as never)
  vi.stubEnv("STRIPE_PRICE_BASIC", "price_basic_from_env")
  vi.stubEnv("APP_URL", "https://app.test")
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("createCheckoutSession", () => {
  it("creates the customer, saves it and opens a subscription checkout", async () => {
    const result = await unwrap(createCheckoutSession("barbearia-a", true))

    expect(result).toEqual({
      url: "https://checkout.stripe.com/c/pay/cs_test_1",
    })

    expect(stripe.customers.create).toHaveBeenCalledTimes(1)
    expect(stripe.customers.create.mock.calls[0][0]).toEqual({
      name: "Barbearia A",
      email: "admin-a@test.local",
      metadata: { barbershopId: f.shop.id, slug: "barbearia-a" },
    })
    expect(await readStripeIds()).toEqual({
      stripeCustomerId: "cus_test_1",
      stripeSubscriptionId: null,
    })

    expect(lastCheckoutParams()).toMatchObject({
      mode: "subscription",
      customer: "cus_test_1",
      line_items: [{ price: "price_basic_from_env", quantity: 1 }],
      client_reference_id: f.shop.id,
      metadata: { barbershopId: f.shop.id, slug: "barbearia-a" },
      subscription_data: {
        metadata: { barbershopId: f.shop.id, slug: "barbearia-a" },
      },
      locale: "pt-BR",
      success_url: `${BILLING_URL}?checkout=success`,
      cancel_url: `${BILLING_URL}?checkout=cancel`,
    })
  })

  it("records who accepted the terms, for which shop and version", async () => {
    await unwrap(createCheckoutSession("barbearia-a", true))

    expect(await prisma.consent.findMany()).toMatchObject([
      {
        userId: f.admin.id,
        barbershopId: f.shop.id,
        context: "CHECKOUT",
        version: LEGAL_VERSION,
      },
    ])
  })

  it("refuses to open a checkout without the terms", async () => {
    await expect(
      unwrap(createCheckoutSession("barbearia-a", false)),
    ).rejects.toThrow(
      "Você precisa aceitar os termos de uso e a política de reembolso.",
    )

    expect(stripe.customers.create).not.toHaveBeenCalled()
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
    expect(await prisma.consent.count()).toBe(0)
  })

  it("records no consent when Stripe fails to open the checkout", async () => {
    stripe.checkout.sessions.create.mockRejectedValueOnce(new Error("stripe"))

    await expect(
      unwrap(createCheckoutSession("barbearia-a", true)),
    ).rejects.toThrow()

    expect(await prisma.consent.count()).toBe(0)
  })

  it("reuses the saved customer on the next call", async () => {
    await unwrap(createCheckoutSession("barbearia-a", true))
    await unwrap(createCheckoutSession("barbearia-a", true))

    expect(stripe.customers.create).toHaveBeenCalledTimes(1)
    expect(stripe.checkout.sessions.create).toHaveBeenCalledTimes(2)
    expect(lastCheckoutParams().customer).toBe("cus_test_1")
    expect((await readStripeIds()).stripeCustomerId).toBe("cus_test_1")
  })

  it("uses the customer another request saved first and deletes its own", async () => {
    // Another click saves its customer while this one is talking to Stripe
    stripe.customers.create.mockImplementationOnce(async () => {
      await setBilling({ stripeCustomerId: "cus_saved_first" })
      return { id: "cus_late" }
    })

    await unwrap(createCheckoutSession("barbearia-a", true))

    expect((await readStripeIds()).stripeCustomerId).toBe("cus_saved_first")
    expect(lastCheckoutParams().customer).toBe("cus_saved_first")
    expect(stripe.customers.del).toHaveBeenCalledWith("cus_late")
  })

  it("saves a single customer when two checkouts run at once", async () => {
    const [first, second] = await Promise.all([
      unwrap(createCheckoutSession("barbearia-a", true)),
      unwrap(createCheckoutSession("barbearia-a", true)),
    ])

    expect(first.url).toBeDefined()
    expect(second.url).toBeDefined()

    const { stripeCustomerId } = await readStripeIds()
    expect(stripeCustomerId).toMatch(/^cus_test_/)

    // Both checkouts use the stored customer, and any extra one is deleted
    const customersUsed = stripe.checkout.sessions.create.mock.calls.map(
      ([params]) => params.customer,
    )
    expect(customersUsed).toEqual([stripeCustomerId, stripeCustomerId])
    expect(stripe.customers.del).toHaveBeenCalledTimes(
      stripe.customers.create.mock.calls.length - 1,
    )
    expect(stripe.customers.del).not.toHaveBeenCalledWith(stripeCustomerId)
  })

  it("passes an idempotency key per shop and admin", async () => {
    await unwrap(createCheckoutSession("barbearia-a", true))

    expect(stripe.customers.create.mock.calls[0]).toEqual([
      expect.anything(),
      { idempotencyKey: `barbershop-customer:${f.shop.id}:${f.admin.id}` },
    ])
  })

  it("carries the rest of the trial over when it has at least 48 h left", async () => {
    const trialEndsAt = new Date(Date.now() + 72 * HOUR_MS)
    await setBilling({ subscriptionStatus: "TRIALING", trialEndsAt })

    await unwrap(createCheckoutSession("barbearia-a", true))

    expect(lastCheckoutParams().subscription_data?.trial_end).toBe(
      Math.floor(trialEndsAt.getTime() / 1000),
    )
  })

  it.each([
    [
      "a trial with less than 48 h left",
      {
        subscriptionStatus: "TRIALING" as const,
        trialEndsAt: new Date(Date.now() + 47 * HOUR_MS),
      },
    ],
    [
      "an ended trial",
      {
        subscriptionStatus: "TRIALING" as const,
        trialEndsAt: new Date(Date.now() - HOUR_MS),
      },
    ],
    [
      "a canceled subscription",
      {
        subscriptionStatus: "CANCELED" as const,
        trialEndsAt: new Date(Date.now() + 72 * HOUR_MS),
      },
    ],
  ])("charges right away for %s (no trial_end)", async (_, billing) => {
    await setBilling(billing)

    await unwrap(createCheckoutSession("barbearia-a", true))

    expect(lastCheckoutParams().subscription_data).not.toHaveProperty(
      "trial_end",
    )
  })

  it.each(["ACTIVE", "TRIALING", "PAST_DUE"] as const)(
    "refuses a second subscription while one is %s",
    async (subscriptionStatus) => {
      await setBilling({
        subscriptionStatus,
        pastDueSince: subscriptionStatus === "PAST_DUE" ? new Date() : null,
        stripeCustomerId: "cus_existing",
        stripeSubscriptionId: "sub_existing",
      })

      await expect(
        unwrap(createCheckoutSession("barbearia-a", true)),
      ).rejects.toThrow(ALREADY_SUBSCRIBED)
      expect(stripe.customers.create).not.toHaveBeenCalled()
      expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
    },
  )

  it.each([
    "active",
    "trialing",
    "past_due",
    "unpaid",
    "incomplete",
    "paused",
  ] as const)(
    "refuses when Stripe has a %s subscription the DB does not know yet",
    async (status) => {
      // The webhook has not landed: the DB still has no subscription
      await setBilling({ stripeCustomerId: "cus_existing" })
      stripe.subscriptions.list.mockResolvedValue({
        data: [{ id: "sub_new", status }],
      })

      await expect(
        unwrap(createCheckoutSession("barbearia-a", true)),
      ).rejects.toThrow(ALREADY_SUBSCRIBED)
      expect(stripe.subscriptions.list).toHaveBeenCalledWith({
        customer: "cus_existing",
        status: "all",
        limit: 10,
      })
      expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
    },
  )

  it("allows a checkout when Stripe only has ended subscriptions", async () => {
    await setBilling({
      subscriptionStatus: "CANCELED",
      stripeCustomerId: "cus_existing",
      stripeSubscriptionId: "sub_old",
    })
    stripe.subscriptions.list.mockResolvedValue({
      data: [
        { id: "sub_old", status: "canceled" },
        { id: "sub_abandoned", status: "incomplete_expired" },
      ],
    })

    await unwrap(createCheckoutSession("barbearia-a", true))

    expect(lastCheckoutParams().customer).toBe("cus_existing")
  })

  it("does not ask Stripe for subscriptions of a brand-new customer", async () => {
    await unwrap(createCheckoutSession("barbearia-a", true))

    expect(stripe.subscriptions.list).not.toHaveBeenCalled()
  })

  it("lets a shop whose subscription was canceled subscribe again with its customer", async () => {
    await setBilling({
      subscriptionStatus: "CANCELED",
      stripeCustomerId: "cus_existing",
      stripeSubscriptionId: "sub_old",
    })

    await unwrap(createCheckoutSession("barbearia-a", true))

    expect(stripe.customers.create).not.toHaveBeenCalled()
    expect(lastCheckoutParams().customer).toBe("cus_existing")
  })

  it("takes the price id from the env, never from the caller", async () => {
    vi.stubEnv("STRIPE_PRICE_BASIC", "price_other_env")
    const callWithExtraInput = createCheckoutSession as unknown as (
      slug: string,
      acceptTerms: boolean,
      input: unknown,
    ) => ReturnType<typeof createCheckoutSession>

    await unwrap(
      callWithExtraInput("barbearia-a", true, {
        price: "price_evil",
        plan: "PRO",
      }),
    )

    expect(lastCheckoutParams().line_items).toEqual([
      { price: "price_other_env", quantity: 1 },
    ])
  })

  it("fails with a pt-BR message while Stripe is not configured", async () => {
    vi.mocked(getStripe).mockReturnValue(null)

    await expect(
      unwrap(createCheckoutSession("barbearia-a", true)),
    ).rejects.toThrow(NOT_CONFIGURED)
    expect((await readStripeIds()).stripeCustomerId).toBeNull()
  })

  it("fails with a pt-BR message while the price id is missing", async () => {
    vi.stubEnv("STRIPE_PRICE_BASIC", "")

    await expect(
      unwrap(createCheckoutSession("barbearia-a", true)),
    ).rejects.toThrow(NOT_CONFIGURED)
    expect(stripe.customers.create).not.toHaveBeenCalled()
  })
})

describe("createPortalSession", () => {
  it("opens the portal for the shop's own customer", async () => {
    await setBilling({
      subscriptionStatus: "ACTIVE",
      stripeCustomerId: "cus_existing",
      stripeSubscriptionId: "sub_existing",
    })

    const result = await unwrap(createPortalSession("barbearia-a"))

    expect(result).toEqual({
      url: "https://billing.stripe.com/p/session/test_1",
    })
    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_existing",
      return_url: BILLING_URL,
    })
  })

  it("refuses a shop without a Stripe customer", async () => {
    await expect(unwrap(createPortalSession("barbearia-a"))).rejects.toThrow(
      NO_CUSTOMER,
    )
    expect(stripe.billingPortal.sessions.create).not.toHaveBeenCalled()
  })

  it("fails with a pt-BR message while Stripe is not configured", async () => {
    await setBilling({ stripeCustomerId: "cus_existing" })
    vi.mocked(getStripe).mockReturnValue(null)

    await expect(unwrap(createPortalSession("barbearia-a"))).rejects.toThrow(
      NOT_CONFIGURED,
    )
  })
})

describe("billing actions of an unpaid shop", () => {
  it.each([
    [
      "an ended trial",
      {
        subscriptionStatus: "TRIALING" as const,
        trialEndsAt: new Date(Date.now() - HOUR_MS),
      },
    ],
    ["a canceled subscription", { subscriptionStatus: "CANCELED" as const }],
    [
      "a past-due subscription after the grace period",
      {
        subscriptionStatus: "PAST_DUE" as const,
        pastDueSince: new Date(Date.now() - 30 * 24 * HOUR_MS),
        stripeSubscriptionId: null,
      },
    ],
  ])("lets the admin pay after %s (allowUnpaid)", async (_, billing) => {
    await setBilling(billing)

    await expect(
      unwrap(createCheckoutSession("barbearia-a", true)),
    ).resolves.toEqual({ url: expect.any(String) })
    await expect(unwrap(createPortalSession("barbearia-a"))).resolves.toEqual({
      url: expect.any(String),
    })
  })

  it("still refuses a non-admin of an unpaid shop", async () => {
    await setBilling({ subscriptionStatus: "CANCELED" })
    const atendente = await createUser()
    await createMembership(atendente.id, f.shop.id, "ATENDENTE")
    mockSession(atendente.id)

    await expect(
      unwrap(createCheckoutSession("barbearia-a", true)),
    ).rejects.toThrow("Sem permissão.")
    await expect(unwrap(createPortalSession("barbearia-a"))).rejects.toThrow(
      "Sem permissão.",
    )
    expect(stripe.customers.create).not.toHaveBeenCalled()
  })
})

describe("hasLiveSubscription", () => {
  it.each([
    ["ACTIVE", "sub_1", true],
    ["TRIALING", "sub_1", true],
    ["PAST_DUE", "sub_1", true],
    ["CANCELED", "sub_1", false],
    ["ACTIVE", null, false],
    ["TRIALING", null, false],
  ] as const)("%s with subscription %s → %s", (status, subId, expected) => {
    expect(
      hasLiveSubscription({
        subscriptionStatus: status,
        stripeSubscriptionId: subId,
      }),
    ).toBe(expected)
  })
})
