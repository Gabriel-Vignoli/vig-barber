import { afterEach, describe, expect, it, vi } from "vitest"
import { prisma } from "@/app/_lib/prisma"
import {
  billingActiveWhere,
  getBillingState,
  type BillingShop,
} from "@/app/_lib/billing"
import {
  GRACE_DAYS,
  getPlanByStripePriceId,
  getPlanConfig,
  getStripePriceId,
  getTrialEndsAt,
  PLANS,
  TRIAL_DAYS,
} from "@/app/_lib/plans"
import { createShop } from "./helpers/factories"

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date("2026-11-02T15:00:00.000Z")
const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs)

const shop = (overrides: Partial<BillingShop>): BillingShop => ({
  subscriptionStatus: "TRIALING",
  trialEndsAt: null,
  pastDueSince: null,
  ...overrides,
})

describe("plans config", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("has one plan, a 14-day trial and a 7-day grace period", () => {
    expect(Object.keys(PLANS)).toEqual(["BASIC"])
    expect(PLANS.BASIC).toMatchObject({
      name: "Vig Barber",
      priceLabel: "R$ 99,90/mês",
      limits: { maxEmployees: null, maxAtendentes: null },
    })
    expect(TRIAL_DAYS).toBe(14)
    expect(GRACE_DAYS).toBe(7)
    expect(getTrialEndsAt(NOW)).toEqual(at(14 * DAY))
  })

  it("has no config for the unused TRIAL value or a future plan", () => {
    expect(getPlanConfig("BASIC")).toBe(PLANS.BASIC)
    expect(getPlanConfig("TRIAL")).toBeNull()
    expect(getPlanConfig("PRO")).toBeNull()
  })

  it("reads the price id from the env and maps it back", () => {
    vi.stubEnv("STRIPE_PRICE_BASIC", "price_basic_test")

    expect(getStripePriceId("BASIC")).toBe("price_basic_test")
    expect(getPlanByStripePriceId("price_basic_test")).toBe("BASIC")
    expect(getPlanByStripePriceId("price_unknown")).toBeNull()
    expect(getPlanByStripePriceId("")).toBeNull()
  })

  it("maps nothing while the price env is unset", () => {
    vi.stubEnv("STRIPE_PRICE_BASIC", "")

    expect(getStripePriceId("BASIC")).toBeNull()
    expect(getPlanByStripePriceId("")).toBeNull()
  })
})

describe("getBillingState", () => {
  it("ACTIVE: has access", () => {
    expect(
      getBillingState(shop({ subscriptionStatus: "ACTIVE" }), NOW),
    ).toEqual({ hasAccess: true, reason: "ACTIVE" })
  })

  it("CANCELED: no access, even with dates left over", () => {
    expect(
      getBillingState(
        shop({
          subscriptionStatus: "CANCELED",
          trialEndsAt: at(5 * DAY),
          pastDueSince: at(-1 * DAY),
        }),
        NOW,
      ),
    ).toEqual({ hasAccess: false, reason: "CANCELED" })
  })

  describe("TRIALING", () => {
    it("has access with the full trial left", () => {
      expect(
        getBillingState(shop({ trialEndsAt: getTrialEndsAt(NOW) }), NOW),
      ).toEqual({ hasAccess: true, reason: "TRIALING", trialDaysLeft: 14 })
    })

    it("has access 1 ms before the trial ends (1 day left, rounded up)", () => {
      expect(getBillingState(shop({ trialEndsAt: at(1) }), NOW)).toEqual({
        hasAccess: true,
        reason: "TRIALING",
        trialDaysLeft: 1,
      })
    })

    it("loses access exactly when the trial ends", () => {
      expect(getBillingState(shop({ trialEndsAt: NOW }), NOW)).toEqual({
        hasAccess: false,
        reason: "TRIAL_ENDED",
      })
    })

    it("has no access after the trial ended", () => {
      expect(
        getBillingState(shop({ trialEndsAt: at(-3 * DAY) }), NOW),
      ).toMatchObject({ hasAccess: false, reason: "TRIAL_ENDED" })
    })

    it("fails closed without a trial end date", () => {
      expect(getBillingState(shop({ trialEndsAt: null }), NOW)).toEqual({
        hasAccess: false,
        reason: "TRIAL_ENDED",
      })
    })
  })

  describe("PAST_DUE", () => {
    const pastDue = (pastDueSince: Date | null) =>
      shop({ subscriptionStatus: "PAST_DUE", pastDueSince })

    it("has access right after the payment failed", () => {
      expect(getBillingState(pastDue(NOW), NOW)).toEqual({
        hasAccess: true,
        reason: "PAST_DUE_GRACE",
        graceEndsAt: at(7 * DAY),
      })
    })

    it("has access 1 ms before the grace period ends", () => {
      const since = at(-7 * DAY + 1)
      expect(getBillingState(pastDue(since), NOW)).toEqual({
        hasAccess: true,
        reason: "PAST_DUE_GRACE",
        graceEndsAt: at(1),
      })
    })

    it("loses access exactly when the grace period ends", () => {
      expect(getBillingState(pastDue(at(-7 * DAY)), NOW)).toEqual({
        hasAccess: false,
        reason: "PAST_DUE_EXPIRED",
        graceEndsAt: NOW,
      })
    })

    it("has no access long after the grace period", () => {
      expect(getBillingState(pastDue(at(-30 * DAY)), NOW)).toMatchObject({
        hasAccess: false,
        reason: "PAST_DUE_EXPIRED",
      })
    })

    it("fails closed without pastDueSince", () => {
      expect(getBillingState(pastDue(null), NOW)).toEqual({
        hasAccess: false,
        reason: "PAST_DUE_EXPIRED",
      })
    })
  })
})

describe("billingActiveWhere", () => {
  it("matches getBillingState for the same shops", async () => {
    const fixtures: (BillingShop & { slug: string })[] = [
      {
        slug: "active",
        subscriptionStatus: "ACTIVE",
        trialEndsAt: null,
        pastDueSince: null,
      },
      {
        slug: "active-old-trial",
        subscriptionStatus: "ACTIVE",
        trialEndsAt: at(-30 * DAY),
        pastDueSince: null,
      },
      {
        slug: "canceled",
        subscriptionStatus: "CANCELED",
        trialEndsAt: at(5 * DAY),
        pastDueSince: null,
      },
      {
        slug: "trial-full",
        subscriptionStatus: "TRIALING",
        trialEndsAt: getTrialEndsAt(NOW),
        pastDueSince: null,
      },
      {
        slug: "trial-last-ms",
        subscriptionStatus: "TRIALING",
        trialEndsAt: at(1),
        pastDueSince: null,
      },
      {
        slug: "trial-ends-now",
        subscriptionStatus: "TRIALING",
        trialEndsAt: NOW,
        pastDueSince: null,
      },
      {
        slug: "trial-ended",
        subscriptionStatus: "TRIALING",
        trialEndsAt: at(-1 * DAY),
        pastDueSince: null,
      },
      {
        slug: "trial-no-date",
        subscriptionStatus: "TRIALING",
        trialEndsAt: null,
        pastDueSince: null,
      },
      {
        slug: "past-due-new",
        subscriptionStatus: "PAST_DUE",
        trialEndsAt: null,
        pastDueSince: NOW,
      },
      {
        slug: "past-due-last-ms",
        subscriptionStatus: "PAST_DUE",
        trialEndsAt: null,
        pastDueSince: at(-7 * DAY + 1),
      },
      {
        slug: "past-due-ends-now",
        subscriptionStatus: "PAST_DUE",
        trialEndsAt: null,
        pastDueSince: at(-7 * DAY),
      },
      {
        slug: "past-due-expired",
        subscriptionStatus: "PAST_DUE",
        trialEndsAt: at(5 * DAY),
        pastDueSince: at(-30 * DAY),
      },
      {
        slug: "past-due-no-date",
        subscriptionStatus: "PAST_DUE",
        trialEndsAt: null,
        pastDueSince: null,
      },
    ]

    for (const fixture of fixtures) await createShop(fixture)

    const rows = await prisma.barbershop.findMany({
      where: billingActiveWhere(NOW),
      select: { slug: true },
      orderBy: { slug: "asc" },
    })

    const expected = fixtures
      .filter((fixture) => getBillingState(fixture, NOW).hasAccess)
      .map((fixture) => fixture.slug)
      .sort()

    expect(rows.map((row) => row.slug)).toEqual(expected)
    // Sanity check: both sides of each boundary are in the fixtures
    expect(expected).toEqual([
      "active",
      "active-old-trial",
      "past-due-last-ms",
      "past-due-new",
      "trial-full",
      "trial-last-ms",
    ])
  })
})
