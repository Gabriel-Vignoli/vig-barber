# Vig Barber → multi-tenant SaaS

## Status

- [x] Phase 0 — tooling
- [x] Phase 1 — schema + seed
- [ ] Phase 2 — tenant library + Vitest
- [ ] Phase 3 — client routes under /b/[slug]
- [ ] Phase 4a — admin + ownership fixes
- [ ] Phase 4b — staff/atendente/memberships
- [ ] Phase 4c — auth
- [ ] Phase 5 — branding
- [ ] Phase 6 — platform + invitations
- [ ] Phase 7 — landing + finder
- [ ] Phase 8 — hardening


## Context
Vig Barber serves one barbershop. Six places call `prisma.barbershop.findFirst()`, and only `BarbershopService` stores a `barbershopId`. Cache keys are global. Roles are one global `User.role`, and several admin mutations load records by id without checking ownership. The goal is a SaaS where many shops run on one deployment and each shop's data stays isolated.

**Decisions made with the user**
- Shops are addressed by path: `/b/[slug]/...`.
- Client accounts are global (one login for every shop).
- Staff roles move to a per-shop `Membership` table, plus a `User.isPlatformAdmin` flag.
- The database has no real data: reset it and seed 3 demo shops.
- `/` becomes a landing page for owners plus a shop finder for clients.
- Per-shop branding covers name, logo, banner and a real address with an embedded map. The timezone stays fixed at America/Sao_Paulo.
- The platform keeps the name "Vig Barber".
- Onboarding is manual: a `/platform` super-admin panel creates shops and sends invitations by email. Stripe comes later; the schema fields are added now.
- Claude tooling: a `tenant-guard` reviewer agent, a `phase-implementer` agent, a `/saas-phase` skill, and a CLAUDE.md update.

## Target schema (prisma/schema.prisma)
- New enums: `MemberRole {ADMIN ATENDENTE EMPLOYEE}`, `Plan {TRIAL BASIC PRO}`, `SubscriptionStatus {TRIALING ACTIVE PAST_DUE CANCELED}`, `ShopStatus {ACTIVE SUSPENDED}`.
- `User`: add `isPlatformAdmin`. `role` and the `Role` enum are dropped in Phase 4c.
- `Barbershop`: add `slug @unique`, `address`, `city`, `latitude?`, `longitude?`, `logoUrl?`, `bannerUrl?` (replaces `imageUrl`), `status`, `plan`, `subscriptionStatus`, `stripeCustomerId?`, `stripeSubscriptionId?`, `trialEndsAt?`.
- `Membership(userId, barbershopId, role)` with `@@unique([userId, barbershopId])`.
- `Invitation(email, barbershopId, role, tokenHash @unique, expiresAt, acceptedAt?, invitedById?)`.
- `Employee`: add `barbershopId`. Replace `userId @unique` with `@@unique([userId, barbershopId])`.
- `Booking`, `Expense` and `Review`: add `barbershopId` with indexes `[barbershopId, bookingDate]` and `[barbershopId, date]`.
- Composite FKs `(employeeId, barbershopId)` and `(serviceId, barbershopId)` on `Booking` act as a database-level guard against cross-shop bookings.

## Route tree
```
/                      landing + shop finder
/login                 global login (replaces /admin/login)
/painel                "Minhas barbearias" (membership chooser)
/convite/[token]       accept invitation
/bookings /profile /privacy-policy   global; bookings list the shop name
/platform/*            super admin (requirePlatformAdmin)
/b/[slug]/layout.tsx   getTenant → notFound; generateMetadata
  (client)/ page, services/[id], employees/[id]
  staff/               employee dashboard
  admin/(dashboard)/   ADMIN
  atendente/           ATENDENTE | ADMIN
legacy: /services/[id], /employees/[id] → permanentRedirect; /admin/* → next.config redirects
```

## Core patterns (to reuse everywhere)
- **`app/_lib/tenant.ts`** (replaces `app/_lib/require-admin.ts` and reuses its React `cache()` pattern):
  - `getTenant(slug)` returns the shop from a cached lookup (key `["shop-by-slug", slug]`, tag `shop-slug:${slug}`) and calls `notFound()` if it is missing or suspended.
  - `getSessionUserId()` reads the user id from the session.
  - `getMembership(shopId, userId)` loads the user's role in that shop.
  - `requireShopRole(slug, roles)` is for pages and redirects on failure.
  - `assertShopRole(slug, roles)` is for actions and throws `"Sem permissão."`.
- **JWT** holds only `id` and `isPlatformAdmin`. Memberships are read from the database on each request, so removing someone takes effect immediately.
- **Actions**:
  - Take `slug` and call `assertShopRole` first.
  - Never trust a `barbershopId` sent from the client.
  - Do child lookups as `findFirst({ where: { id, barbershopId } })`.
  - Delete actions remove the Membership and never the global User.
- **Caches**: keys include `shop.id`, with tag `shop:${id}`. `unstable_cache` returns JSON, so convert dates and decimals back after reading.
- **`app/_lib/revalidate.ts`**: `revalidateShop(shop)` runs `updateTag(shop:${id})` and `revalidatePath(\`/b/${slug}\`, "layout")`.
- **`app/_constants/roles.ts`**: a single `BOOKING_BLOCKED_ROLES`, checked against the membership in the target shop. It replaces the four duplicated copies.
- **`proxy.ts`**: an optimistic check only. A request without a token to `/painel`, `/platform`, `/b/:slug/(admin|atendente|staff)` or `/bookings` redirects to `/login?callbackUrl=`. The employee path allowlist is removed.

## Phases
Each phase leaves lint, build and tests green and ships as small conventional commits.

- **Phase 0 — tooling** (`chore`, `docs`)
  - Copy this plan to `docs/multi-tenant-plan.md` with a status checklist.
  - Create `.claude/agents/tenant-guard.md`, `.claude/agents/phase-implementer.md` and `.claude/skills/saas-phase/SKILL.md`.
  - Add a "migration in progress" note to CLAUDE.md.
- **Phase 1 — schema + seed** (`feat(schema)`)
  - Write the new baseline migration and run `prisma generate`. `User.role` stays temporarily.
  - Make the minimal compile fixes.
  - Rewrite `prisma/seed.ts` with 3 shops: a platform admin, an owner per shop, a user who is ATENDENTE in shop A and a client in shop B, and a barber who works in two shops.
  - ⚠ `migrate reset` on Supabase drops data. Confirm with the user before running it.
- **Phase 2 — tenant library + Vitest**
  - Add `tenant.ts`, `revalidate.ts`, `roles.ts`, and a slug validator with a reserved-word list.
  - Set up Vitest with mocks for `next-auth`, `next/cache` and `next/navigation`, running against a disposable local Postgres in Docker.
- **Phase 3 — client routes under `/b/[slug]`**
  - Move the home, service and employee pages.
  - Replace the `findFirst` calls in `app/page.tsx`, `app/employees/[id]/page.tsx` and `app/_data/get-barbershop.ts`.
  - Scope the caches to the shop.
  - The public actions `get-bookings`, `get-employee-schedule` and `get-employees-for-service` take `slug` and use a minimal `select`.
  - `create-booking` and `replace-booking` check that the service, employee and their link all belong to the shop.
  - Thread `slug` through links: grep `href="/` and `router.push("/`.
  - Add legacy redirects.
- **Phase 4a — admin + ownership fixes**
  - Move to `b/[slug]/admin`.
  - Every `get-admin-*` fetcher and every stats/overview action takes `shopId`.
  - Admin actions use scoped lookups, including `create-service` and `update-barbershop`.
  - Add isolation tests (foreign id, foreign slug, non-member).
- **Phase 4b — staff/atendente/memberships**
  - Add `b/[slug]/atendente` and `b/[slug]/staff`.
  - `create-employee` and `create-atendente` attach existing users through a Membership and never overwrite their name or password.
  - Delete actions remove the Membership.
  - `create-walkin-booking` gets the shop from `slug`.
- **Phase 4c — auth**
  - Add `/login` and `/painel`. Slim the JWT.
  - Rewrite `proxy.ts`. Remove `require-admin.ts` and `get-user-role.ts`.
  - Drop `User.role` and add the `/admin/*` redirects.
  - Update `sign-in-dialog`, `sidebar-sheet`, `header` and `admin-login-form`.
- **Phase 5 — branding**
  - Install UploadThing. Its middleware runs `assertShopRole`. Add `*.ufs.sh` to `next.config.ts`.
  - Add logo, banner and address fields to the form.
  - Replace `map.png` with a Google Maps embed iframe (no API key needed).
  - Generate metadata per shop.
  - Make root metadata, the email sender and the privacy policy platform-generic.
- **Phase 6 — platform + invitations**
  - Add `requirePlatformAdmin`.
  - `/platform` handles listing, creating, suspending and inviting.
  - Invitation tokens are 32 random bytes, stored as a sha256 hash, valid for 7 days, and emailed with Resend.
  - `/convite/[token]` checks that the signed-in email matches the invite, then creates the Membership in a transaction.
- **Phase 7 — landing + finder**
  - Marketing hero with a contact CTA.
  - Client search over active shops by name or city.
- **Phase 8 — hardening**
  - Full tenant-guard sweep and isolation tests for every mutation.
  - Remove the legacy redirects later.
  - Final CLAUDE.md update and a stub Stripe webhook.

## Claude tooling (Phase 0 contents)
- **`tenant-guard`** (read-only; tools Read, Grep, Glob, Bash)
  - Checks:
    - every query on a tenant model is scoped
    - no `findUnique({id})` is followed by a mutation without a shop check
    - no `barbershop.findFirst()`
    - `assertShopRole` runs before any read
    - no `barbershopId` comes from the client
    - no global role checks
    - cache keys and tags include the shop id
    - `revalidatePath` uses literal paths
    - public actions use a minimal `select`
    - deletes never remove a User
  - Output: a BLOCKER/WARN/NIT table with file:line and a verdict.
- **`phase-implementer`** (all tools)
  - Reads CLAUDE.md, the phase section and the Next docs.
  - Implements one phase and runs lint, build and test.
  - Commits with conventional messages.
  - Never runs `migrate reset` against a remote database without confirmation.
  - Stops when a decision is needed that the plan doesn't cover.
- **`/saas-phase <n>`**
  - Checks that the git tree is clean and the previous phases are done.
  - Hands the phase to `phase-implementer`, then runs `tenant-guard`.
  - Loops until there are no BLOCKERs.
  - Runs lint, build and test, ticks the checklist and updates CLAUDE.md.
- **CLAUDE.md**
  - New route tree and domain model.
  - A "Tenancy rules" section.
  - Remove the singleton and global-role notes.
  - Add `npm run test` and new commit scopes (`tenant`, `platform`, `landing`).

## Verification
- Every phase: `npm run lint`, `npm run build`, and `npm run test` from Phase 2 onward.
- Vitest isolation suite, for each mutating action:
  - a foreign resource id throws and leaves the database unchanged
  - a foreign slug throws
  - a non-member is rejected
  - public actions never return another shop's rows
- Manual smoke test with the seeded users (`npm run dev`):
  - the cross-shop user can't open `/b/<other>/admin`
  - each admin sees only their own numbers
  - old URLs redirect
  - the invitation flow works end to end
