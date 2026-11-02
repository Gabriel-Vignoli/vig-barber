-- Billing B1: subscription state for the Stripe billing. Additive only, so it
-- can run before the deploy (the old code ignores the new columns).

-- AlterTable
ALTER TABLE "Barbershop" ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "pastDueSince" TIMESTAMP(3),
ALTER COLUMN "plan" SET DEFAULT 'BASIC';

-- plan is the tier being trialed or paid for; the trial is only a status.
-- The TRIAL enum value stays (unused) until a later cleanup.
UPDATE "Barbershop" SET "plan" = 'BASIC' WHERE "plan" = 'TRIAL';

-- Shops created before billing (no Stripe subscription yet) get a fresh
-- 14-day trial from the migration date (TRIAL_DAYS in app/_lib/plans.ts).
UPDATE "Barbershop"
SET "trialEndsAt" = now() + interval '14 days',
    "subscriptionStatus" = 'TRIALING'
WHERE "stripeSubscriptionId" IS NULL;
