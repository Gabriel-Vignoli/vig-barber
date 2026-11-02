# Vig Barber → Stripe billing

## Status

- [x] Phase B1 — plans config, billing state, schema (migration `20261102120000_billing_state` applied to Supabase on 2026-11-02)
- [x] Phase B2 — access gate (what an unpaid shop loses)
- [x] Phase B3 — billing page: Checkout + Customer Portal
- [ ] Phase B4 — webhook sync
- [ ] Phase B5 — platform panel + plan limits hook
- [ ] Phase B6 — production rollout

Run a phase with `/saas-phase B1` (the skill reads this file for `B*` ids).

## Decisions made with the user (2026-11-02)
- **One plan for now:** "Vig Barber" at **R$ 99,90/month**, card only. More plans (e.g. Básico / Pro) come later, each with its own employee and atendente limits. The code is built so that a new plan is one entry in a config file plus one Stripe price.
- **Trial:** 14 days, no card needed. It starts when the shop is created in `/platform`. The trial lives in our DB (`trialEndsAt`), not in Stripe.
- **Grace period:** 7 days after a renewal payment fails (Stripe keeps retrying the card during that time).
- **Existing shops** (the demo shops and any shop created before billing goes live) get a fresh 14-day trial from the migration date.
- **Unpaid ≠ suspended.** `SUSPENDED` stays the platform's manual switch (404 everywhere). An unpaid shop keeps its data and its URL, but it can't take bookings, and only its ADMIN can still get in, and only to pay.

## Context (what exists today)
- `Barbershop` already has `plan` (`TRIAL | BASIC | PRO`, default `TRIAL`), `subscriptionStatus` (`TRIALING | ACTIVE | PAST_DUE | CANCELED`, default `TRIALING`), `stripeCustomerId`, `stripeSubscriptionId` and `trialEndsAt`. Nothing writes them yet.
- `app/_lib/stripe.ts` → `getStripe()` (lazy, `null` without a key). The SDK version is pinned to `stripe@23.0.0`.
- `app/api/stripe/webhook/route.ts` is a stub: it verifies the signature, logs the event and writes nothing to the DB.
- The tenant object (`tenant.ts` → `tenantSelect`) already includes `plan`, `subscriptionStatus` and `trialEndsAt`, and leaves out the Stripe ids. It is cached per slug for 300 s under `shopSlugTag`.
- `revalidateShop` uses `updateTag`, which only works in Server Actions. **The webhook route handler can't call it**; use `revalidateTag(tag, …)` there (check `node_modules/next/dist/docs/` for the Next 16 signature).

## Core design

### Plans config: `app/_lib/plans.ts` (the single source of truth for plans)
```ts
export const PLANS = {
  BASIC: {
    name: "Vig Barber",
    priceLabel: "R$ 99,90/mês",
    stripePriceEnv: "STRIPE_PRICE_BASIC", // price id read from env, per environment
    limits: { maxEmployees: null, maxAtendentes: null }, // null = unlimited
  },
  // PRO: { ... } later
} as const satisfies Record<Exclude<Plan, "TRIAL">, PlanConfig | undefined>
export const TRIAL_DAYS = 14
export const GRACE_DAYS = 7
```
- `plan` is the tier being trialed or paid for, and the trial is only a status. The default becomes `BASIC`; the migration moves `TRIAL` rows to `BASIC`. The `TRIAL` enum value stays unused for now (removing an enum value is a breaking migration) and gets cleaned up later.
- The price id comes from the server's env, mapped from the plan key. **The client never sends a price id**; it sends a plan key, if anything.
- The webhook maps a Stripe price id back to a plan key through the same config. An unknown price id gets logged, and the plan is left unchanged.

### Billing state: `app/_lib/billing.ts` (pure, unit-tested)
`getBillingState(shop, now) → { hasAccess, reason, trialDaysLeft?, graceEndsAt? }`
| subscriptionStatus | access |
|---|---|
| `TRIALING` | while `trialEndsAt > now` |
| `ACTIVE` | yes |
| `PAST_DUE` | while `pastDueSince + 7 days > now` |
| `CANCELED` | no |

Plus `billingActiveWhere(now)`: the same rule as a Prisma `where`, for list queries (the landing finder).
Time math works on instants (`Date`), never on calendar days, so UTC vs São Paulo doesn't matter here. Display goes through `timezone.ts`.

### Schema changes (B1 migration; additive only)
- `Barbershop.pastDueSince DateTime?`: set the first time the shop enters `PAST_DUE`, cleared when it leaves.
- `Barbershop.currentPeriodEnd DateTime?`: the date of the next charge, for display. Stripe API ≥ 2025-03 puts the period on the **subscription item**, not on the subscription.
- `plan` default changes to `BASIC`, and the data step moves `TRIAL` → `BASIC`.
- Backfill: `trialEndsAt = now() + 14 days` and `subscriptionStatus = 'TRIALING'` for shops with no `stripeSubscriptionId`.
- Additive, so the migration can run before the deploy (the old code ignores the new columns). Still confirm with the user before `migrate deploy` on Supabase.

### Stripe mapping (webhook → DB)
| Stripe `subscription.status` | our `subscriptionStatus` |
|---|---|
| `trialing` | `TRIALING` |
| `active` | `ACTIVE` |
| `past_due`, `unpaid` | `PAST_DUE` |
| `canceled`, `incomplete_expired` | `CANCELED` |
| `incomplete`, `paused` | unchanged (payment not confirmed yet) |

- **Order-safe and idempotent:** for any subscription or invoice event, take the subscription id, **retrieve the subscription fresh from Stripe**, and write its current state. This ignores event order and duplicate deliveries.
- **Find the shop by `stripeCustomerId`.** That id is written by our own checkout action before the customer ever reaches Stripe. Event metadata is never trusted alone.
- Events: `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.paid`, `invoice.payment_failed`.
- When the webhook writes, it expires the shop's cache tags (with `revalidateTag`, see Context).

### Access gate (B2)
- `assertShopRole` / `requireShopRole` gain a billing check: when `hasAccess` is false,
  - ADMIN pages → redirect to `/b/[slug]/admin/billing`
  - ATENDENTE / EMPLOYEE pages → a "Barbearia com assinatura pendente" screen
  - actions → `ActionError("A assinatura desta barbearia está pendente.")`
  - opt-out: `{ allowUnpaid: true }`, used ONLY by the billing page, the billing actions and the admin `(dashboard)/layout.tsx`. Layouts don't get the pathname, so the layout only checks membership and draws the banners; every admin page under it except billing calls `requireShopRole` without `allowUnpaid` and is the real gate.
  - ATENDENTE / EMPLOYEE of an unpaid shop are redirected to `/b/[slug]/assinatura-pendente`. Customers see "Agendamentos indisponíveis no momento." and never the reason.
  - `accept-invitation` is not gated on purpose (an invited owner must be able to join an unpaid shop to pay).
- Public side: the shop page stays reachable (links people already have keep working) but shows "Agendamentos indisponíveis no momento" and hides the booking buttons. `create-booking`, `replace-booking` and `create-walkin-booking` reject through the shared booking guard. `search-shops` filters with `billingActiveWhere`.
- Clients can still view and cancel their existing bookings (`delete-booking` stays open).
- Trial and grace banners in the admin layout: "Seu teste termina em X dias", "Pagamento falhou, regularize até DD/MM".

### Billing page and actions (B3)
- `/b/[slug]/admin/billing` ("Assinatura"), ADMIN only, `allowUnpaid`. It shows the plan, the status, the trial days left or the next charge date, and one button:
  - no subscription → **Assinar** → `create-checkout-session(slug)`
  - has a subscription → **Gerenciar assinatura** → `create-portal-session(slug)` (card, cancel, invoices)
- `create-checkout-session(slug)`: `assertShopRole(slug, ["ADMIN"], { allowUnpaid: true })`. It creates the Stripe customer if missing (with `metadata.barbershopId` and the email of the admin who clicked) and saves `stripeCustomerId` first. Then it opens a Checkout Session in `mode: "subscription"` with the env price id and returns the URL.
  - If the trial still has ≥ 48 h left, it passes `subscription_data.trial_end = trialEndsAt` so the remaining trial isn't lost (Stripe requires trial_end ≥ 48 h in the future).
  - It refuses when an `ACTIVE`/`TRIALING`/`PAST_DUE` Stripe subscription already exists (send the user to the portal instead).
  - `success_url` → `/b/[slug]/admin/billing?checkout=success`. The page says "Processando pagamento…" until the webhook lands; **the redirect never grants access, only the webhook does**.
- `create-portal-session(slug)`: same guard, needs `stripeCustomerId`, returns the portal URL.
- URLs are built with `getAppOrigin()`.
- Both actions go into the isolation matrix in `tests/admin-actions.test.ts`, with `getStripe` mocked (tests never touch the network).

### Platform (B5)
- `/platform` table: status column ("Teste até DD/MM", "Ativa", "Pagamento pendente", "Cancelada").
- `extend-trial(shopId, days)` action (platform admin only) for comped shops and demos.
- **Plan limits hook:** `assertPlanLimit(shop, "employees" | "atendentes")`, called in `create-employee`, `create-atendente` and their invite paths (pending invitations count toward the limit). With today's single unlimited plan it never blocks; tests use a fake limited plan so the hook is proven before a Pro plan exists.

## Phases
- **B1 — plans config, billing state, schema** (`feat(billing)`, `feat(schema)`)
  - `plans.ts`, `billing.ts` + unit tests (every row of the access table, both sides of each boundary).
  - Migration as above, `npx prisma generate`, then update the seed (one shop trialing, one active, one past-due inside its grace period, to make demos easy).
  - `create-shop` sets `trialEndsAt = now + 14 days`.
  - Add `STRIPE_PRICE_BASIC` to `.env.example`.
- **B2 — access gate** (`feat(billing)`, `feat(booking)`, `feat(admin)`)
  - Gate in the tenant helpers, booking guard, `search-shops`, the public page notice, the staff blocked screen and the admin banners.
  - First add `pastDueSince` to `tenantSelect` in `tenant.ts` and rebuild it as a `Date` in `hydrateTenant` (`unstable_cache` returns strings). Without it, every PAST_DUE shop is blocked during its grace period.
  - Tests: an unpaid shop's admin actions throw, booking is refused, the shop disappears from the finder, and the billing opt-out still works.
- **B3 — billing page + Checkout + Portal** (`feat(billing)`)
  - Page with `loading.tsx`, the two actions, a sidebar link "Assinatura", isolation-matrix entries.
- **B4 — webhook sync** (`feat(billing)`)
  - Replace the stub: sync from a fresh subscription, cache expiry, unknown-customer events answered 200 and logged (so Stripe doesn't retry forever).
  - Cache expiry: the gate reads the shop lookup cached for 300 s, and `revalidateShop` (`updateTag`) can't run in a route handler. Call `revalidateTag(shopSlugTag(slug), …)` and `revalidateTag(shopTag(id), …)` directly, and test that the gate opens right after a webhook write.
  - From the B3 review: find the shop by `stripeCustomerId` (the checkout's `metadata` / `client_reference_id` only cross-check), and never set `stripeCustomerId` back to null (create-checkout-session's idempotency key would hand back a deleted customer within 24 h). After a checkout the billing page doesn't refresh by itself; consider a short auto-refresh while `?checkout=success` and not yet live.
  - Tests: build signed payloads with `stripe.webhooks.generateTestHeaderString` and mock `subscriptions.retrieve`; cover duplicates, out-of-order events, `pastDueSince` set and cleared, and an unknown price id.
  - Manual check: `stripe listen --forward-to localhost:3000/api/stripe/webhook` + `stripe trigger` / test card `4242 4242 4242 4242`, and `4000 0000 0000 0341` for a failing renewal.
- **B5 — platform + limits hook** (`feat(platform)`, `feat(employees)`)
- **B6 — production rollout** (`docs`, `chore`)
  - Stripe dashboard (test mode first): product "Vig Barber", recurring price R$ 99,90/month → `STRIPE_PRICE_BASIC`; Customer Portal enabled (update card, cancel at period end, invoice history; plan switching off until there are more plans); retry schedule for failed payments ≈ 7 days.
  - Vercel env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (from the dashboard endpoint `https://vig-barber.vercel.app/api/stripe/webhook`), `STRIPE_PRICE_BASIC`.
  - Order: push + deploy → `prisma migrate deploy` (confirm first) → set env → redeploy → run one test-mode checkout end to end on production.
  - ⚠ **Restart the trials at go-live.** The B1 migration was applied to Supabase on 2026-11-02, so those trials end around 2026-11-16. If the B2 gate ships after that date, every existing shop locks at once. At go-live, give the shops with no Stripe subscription a fresh 14-day trial (with `extend-trial` from B5, or the same SQL as the B1 backfill, after confirming with the user).
  - Update CLAUDE.md (billing section, new routes and env vars) and the Obsidian note.

## Stripe dashboard setup (user, can be done any time before B3)
1. Product catalog → **Add product**: name "Vig Barber", price **99,90 BRL**, **Recurring**, **Monthly**. Save, then copy the price id (`price_...`) into `.env` as `STRIPE_PRICE_BASIC`.
2. Settings → Billing → **Customer portal**: turn on "Update payment method", "Cancel subscriptions" (at the end of the period) and "Invoice history".
3. Install the Stripe CLI (`winget install Stripe.StripeCli`), run `stripe login`, then `stripe listen --forward-to localhost:3000/api/stripe/webhook` → copy the `whsec_...` value into `.env` as `STRIPE_WEBHOOK_SECRET` (needed from B4).

## Later (not in this plan)
- More plans (Pro …) with real limits, and upgrade/downgrade in the portal.
- Pix/boleto (not for recurring card subscriptions; revisit if shops ask).
- Email reminders before the trial ends (needs a verified Resend domain).
- Drop the unused `TRIAL` enum value.
- Live mode: activate the Stripe account (CPF/CNPJ, bank account).
