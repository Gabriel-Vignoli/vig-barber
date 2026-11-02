import type { Plan } from "@/app/generated/prisma/enums"

// The single source of truth for plans. A new plan is one entry here plus one
// Stripe price (its id in the env variable named by stripePriceEnv).

// TRIAL is a leftover enum value: the trial is a status, not a plan
export type PaidPlan = Exclude<Plan, "TRIAL">

export type PlanConfig = {
  name: string
  priceLabel: string
  // Name of the env variable holding the Stripe price id (one per environment)
  stripePriceEnv: string
  // null = unlimited
  limits: { maxEmployees: number | null; maxAtendentes: number | null }
}

export const PLANS = {
  BASIC: {
    name: "Vig Barber",
    priceLabel: "R$ 99,90/mês",
    stripePriceEnv: "STRIPE_PRICE_BASIC",
    limits: { maxEmployees: null, maxAtendentes: null },
  },
  // PRO: { ... } later
} as const satisfies Partial<Record<PaidPlan, PlanConfig>>

export type PlanKey = keyof typeof PLANS

export const DEFAULT_PLAN: PlanKey = "BASIC"
export const TRIAL_DAYS = 14
export const GRACE_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000

export const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_MS)

// trialEndsAt for a shop created at `now`
export const getTrialEndsAt = (now: Date) => addDays(now, TRIAL_DAYS)

export const isPlanKey = (value: unknown): value is PlanKey =>
  typeof value === "string" && Object.hasOwn(PLANS, value)

export const getPlanConfig = (plan: Plan): PlanConfig | null =>
  isPlanKey(plan) ? PLANS[plan] : null

// The Stripe price id for a plan, read from the server's env. The client never
// sends a price id, only a plan key.
export const getStripePriceId = (plan: PlanKey): string | null =>
  process.env[PLANS[plan].stripePriceEnv] || null

// Maps a Stripe price id back to a plan key (webhook). Unknown ids give null,
// and the caller leaves the plan unchanged.
export const getPlanByStripePriceId = (priceId: string): PlanKey | null => {
  if (!priceId) return null

  for (const key of Object.keys(PLANS) as PlanKey[]) {
    if (getStripePriceId(key) === priceId) return key
  }

  return null
}
