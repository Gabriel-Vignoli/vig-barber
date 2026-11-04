# Vig Barber

A multi-tenant SaaS for barbershops, built with Next.js, TypeScript, Prisma and PostgreSQL. Many shops run on one deployment, each at its own URL (`/b/<slug>`) with its own data, branding and staff. Clients have one global account: they find a shop on the landing page and book a service with a specific barber. Staff work in role-specific areas of their shop, and shops pay a monthly subscription through Stripe.

**Live:** [vig-barber.vercel.app](https://vig-barber.vercel.app) (billing runs in Stripe test mode, so use the test card `4242 4242 4242 4242`)

## ✨ Features

**For clients**

- One account for every shop, with Google or email/password login and a lockout after repeated failed attempts
- Landing page with a shop finder that searches active shops by name or city
- Book a service with a specific barber: available times follow the service's real duration and the barber's working hours for that weekday
- Conflict detection when a new booking overlaps one you already have, with options to keep both, replace the old one or pick another time
- Leave, edit and remove reviews for past bookings (half-star ratings)
- See all your bookings across every shop, cancel upcoming ones, and contact the shop or the barber on WhatsApp
- Each shop shows its own logo, banner, address and an embedded map

**For shop staff** (roles come from a membership in each shop, so one person can be an admin in one shop and a client in another)

- **Admin:** dashboard with bookings and revenue by day, week or month, charts by service and expense category; manage services, barbers (services, weekly schedules, stats), front-desk staff, expenses, bookings and the shop's branding; invite staff by email; manage the subscription
- **Front desk (atendente):** walk-in screen to book for clients who don't use the app, plus the shop's bookings list
- **Barber:** their own upcoming and finished bookings, filterable by date
- `/painel` ("Minhas barbearias") lists every shop a person works at

**For the platform**

- Super admin panel (`/platform`) to create, suspend and reactivate shops, invite owners, see each shop's billing status and extend trials
- Single-use invitation links that expire in 7 days (only a hash of the token is stored)

**Billing**

- One plan, R$ 99,90/month by card, through Stripe Checkout and the Stripe Customer Portal
- 14-day free trial with no card, and 7 days of grace after a failed payment
- An unpaid shop keeps its data and URL, but stops taking bookings and drops out of the finder until it pays
- The Stripe webhook is the only thing that grants access. It verifies the signature and re-reads the subscription from Stripe, so late or repeated events cannot reactivate a cancelled shop

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack), React 19
- **Language:** TypeScript
- **Database:** PostgreSQL (Supabase) with Prisma 7 and the `pg` driver adapter
- **Auth:** NextAuth v4 (Google + Credentials, JWT sessions)
- **Payments:** Stripe (Checkout, Customer Portal, webhooks)
- **UI:** Tailwind CSS v4, shadcn on Base UI, lucide icons, Recharts, sonner
- **Forms:** react-hook-form + zod
- **Email:** Resend (password reset and invitations)
- **Uploads:** UploadThing (shop logo and banner)
- **Tests:** Vitest against a throwaway embedded PostgreSQL
- **Deploy:** Vercel

## 🔒 How tenancy works

- The shop always comes from the URL `slug` (or from a row the user already owns, like their booking). A `barbershopId` sent by the browser is never trusted.
- Every query on shop data is scoped by `barbershopId`. Updates and deletes filter by both the record id and the shop id, then check that a row was actually changed.
- Roles live in a `Membership` per user and shop, and are read from the database on every request. Platform admins get no implicit access to shops.
- Cached reads are keyed and tagged by shop, so one shop's change never serves stale or foreign data to another.
- Every mutation has an isolation test: it is called with another shop's slug, a wrong role, a non-member and a signed-out user, and must refuse all of them.

The full design and the migration from a single-shop app are in [`docs/multi-tenant-plan.md`](docs/multi-tenant-plan.md); billing is in [`docs/billing-plan.md`](docs/billing-plan.md).

## 🚀 Getting Started

### Prerequisites

- Node.js 20.19 or newer (required by Prisma 7)
- A PostgreSQL database (Supabase, Neon or local)

### Setup

```bash
git clone https://github.com/Gabriel-Vignoli/vig-barber.git
cd vig-barber

# Also generates the Prisma client into app/generated/prisma
npm install

cp .env.example .env
```

Fill in `.env`. Only the database and NextAuth variables are required to start; the other services turn themselves off while their keys are missing.

| Variable                                                           | What it is for                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------- |
| `DATABASE_URL`                                                     | Transaction pooler (port 6543), used by the app         |
| `DIRECT_URL`                                                       | Session pooler (port 5432), used by the Prisma CLI      |
| `NEXT_AUTH_SECRET`                                                 | NextAuth session secret                                 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                         | Google login                                            |
| `RESEND_API_KEY`, `EMAIL_FROM`                                     | Password reset and invitation emails                    |
| `APP_URL`                                                          | Absolute origin for links in emails (custom domain)     |
| `UPLOADTHING_TOKEN`                                                | Shop logo and banner uploads                            |
| `CONTACT_EMAIL`, `CONTACT_WHATSAPP`                                | Contact buttons on the landing page (hidden when unset) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BASIC` | Subscriptions and the webhook                           |

```bash
# Apply migrations and seed 3 demo shops
npx prisma migrate dev
npx prisma db seed

npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The demo users (a platform admin, shop owners, barbers, a front-desk user and clients) are listed in `prisma/seed.ts`.

To test billing locally, forward Stripe events to the webhook and put the secret it prints in `STRIPE_WEBHOOK_SECRET`:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed
```

> **Prisma 7:** `migrate dev` no longer runs `prisma generate` or the seed. After you change `prisma/schema.prisma`, run `npx prisma generate` yourself. The CLI reads its settings from `prisma.config.ts`.
>
> **Connection errors?** Some networks (school or corporate wifi) block port 6543. If you get P1017 (`Server has closed the connection`) locally, try another network or point your local `DATABASE_URL` at the 5432 URL.

## 🧪 Tests

```bash
npm run test
```

The suite (400+ tests) runs against a throwaway PostgreSQL started by `embedded-postgres`, with the real migrations applied, so it needs no Docker and never touches your `.env` database. It covers cross-shop isolation for every mutation, booking rules and availability, reviews, invitations, plan limits, the billing gate and the Stripe webhook sync.

Before pushing: `npm run lint`, `npm run build` and `npm run test`.

## 📁 Project Structure

```
vig-barber/
├── app/
│   ├── (landing)/          # Platform landing page and shop finder at /
│   ├── b/[slug]/           # One shop
│   │   ├── (client)/       #   Shop home, service and barber pages
│   │   ├── admin/          #   Admin panel (dashboard, services, staff, expenses, billing...)
│   │   ├── atendente/      #   Front-desk walk-in screen and bookings
│   │   ├── staff/          #   Barber's own bookings
│   │   └── assinatura-pendente/  # Shown to staff while the shop is unpaid
│   ├── platform/           # Super admin panel
│   ├── painel/             # "Minhas barbearias"
│   ├── convite/[token]/    # Accept an invitation
│   ├── login/ bookings/ profile/
│   ├── api/                # NextAuth, UploadThing and the Stripe webhook
│   ├── _actions/           # Server Actions, one per file
│   ├── _data/              # Server-only data fetchers used by pages
│   ├── _lib/               # Tenant helpers, auth, billing, Stripe, time logic, validations
│   └── components/         # Feature components (ui/ holds the shadcn primitives)
├── prisma/                 # Schema, migrations and seed
├── tests/                  # Vitest suite
├── docs/                   # Multi-tenant and billing plans
├── prisma.config.ts        # Prisma CLI config
└── proxy.ts                # Requires a session on protected routes (roles are checked by pages)
```

## 🧠 Technical Notes

- **Duration-aware availability:** time slots come from each service's real duration and the barber's working hours for that weekday, and a slot is rejected when any part of it overlaps an existing booking.
- **Timezone:** the business runs on São Paulo time but Vercel runs in UTC, so day, week and month ranges use dedicated helpers instead of raw `Date` math.
- **Errors in production:** Next.js replaces the message of any error thrown by a Server Action with generic text in production. Mutations return `{ ok, data }` or `{ ok: false, error }` instead, so the Portuguese messages reach the user.
- **Login lockout:** NextAuth v4 hides custom errors thrown in `authorize()`, so failed attempts are tracked by a separate Server Action called before sign-in.
- **Webhook ordering:** Stripe can deliver events late or more than once. The sync reads the subscription fresh from Stripe and writes with a compare-and-set, so it is idempotent and safe to retry.
- **`Decimal` serialization:** Prisma `Decimal` values are converted to `number` before they reach Client Components.

## 📌 Status

Live and in active development. Billing still runs in Stripe test mode while the first shops try the system.

## 👤 Author

**Gabriel Vignoli** — [GitHub](https://github.com/Gabriel-Vignoli) · [LinkedIn](https://www.linkedin.com/in/gabriel-vignoli/)
