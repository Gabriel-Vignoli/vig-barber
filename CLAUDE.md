@AGENTS.md

# Vig Barber — project context

Full-stack booking platform for a single barbershop. Clients book services with a specific barber. Staff work in role-specific areas: employee dashboard, front-desk walk-in screen, admin panel.

## Multi-tenant migration in progress
The app is being converted into a multi-tenant SaaS (shops at `/b/[slug]`, per-shop `Membership` roles). The plan, target schema, core patterns and phase status live in `docs/multi-tenant-plan.md`. Sections below describe the **current** single-shop code until each phase updates them. Run phases with `/saas-phase`. After touching actions, data fetchers, routes or the schema, run the `tenant-guard` agent.

## Stack
- Next.js 16.2 (App Router, Turbopack), React 19.2, TypeScript (path alias `@/*` → repo root)
- Prisma 7 + PostgreSQL (Supabase) through the `@prisma/adapter-pg` driver adapter. `DATABASE_URL` = transaction pooler (port 6543), used by the app at runtime. `DIRECT_URL` = session pooler (port 5432), used by the CLI through `prisma.config.ts`
- NextAuth **v4** (JWT sessions) with Google + Credentials providers and `@auth/prisma-adapter`
- Tailwind CSS v4 + shadcn (style `base-nova`, built on **Base UI**, not Radix) + lucide icons
- react-hook-form + zod v4, sonner toasts, Recharts, date-fns (`ptBR` locale), Resend email
- Deployed on Vercel (UTC runtime)

## Commands
- `npm run dev` / `npm run build` / `npm run lint`
- `npx prisma migrate dev` · `npx prisma db seed` (runs `prisma/seed.ts` via tsx, configured in `prisma.config.ts`)
- `postinstall` runs `prisma generate`. In Prisma 7, `migrate dev` no longer runs `generate` or the seed, so run `npx prisma generate` yourself after you change the schema
- `npm run test` runs Vitest (`tests/`) against a throwaway local Postgres (`embedded-postgres`, binaries come with the npm package; data lives in the gitignored `.tmp/`) with `prisma migrate deploy` applied. Check your work with `npm run lint`, `npm run build` and `npm run test`.

## Layout
- `app/_actions/` — Server Actions (`"use server"`), one exported function per file, kebab-case filename (`create-booking.ts` → `createBooking`). Both mutations and client-called queries live here.
- `app/_data/` — server-side data fetchers used by pages (`get-admin-*`, `get-*-bookings`, shop-scoped cached `get-shop-services` / `get-shop-employees`).
- Public booking actions (`get-bookings`, `get-employee-schedule`, `get-employees-for-service`, `create-booking`, `replace-booking`) take the shop `slug` first. `app/_lib/customer-booking.ts` holds the shared booking guard and `getViewerBookingBlocked` (staff of THIS shop cannot book there).
- `app/_lib/` — `auth.ts` (authOptions), `prisma.ts` (singleton client), `require-admin.ts` (`requireAdmin`, `requireAtendente`), `timezone.ts`, `time-list.ts` (slot availability), `resend.ts`, `utils.ts` (`cn`), `validations/*.ts` (zod schemas + inferred `*FormValues` types).
- `app/components/` — flat folder of feature components. `app/components/ui/` holds the shadcn/Base UI primitives.
- `app/_providers/`, `app/_constants/`
- Routes: `/` (employee dashboard when the user is EMPLOYEE; everyone else is temporarily redirected to the oldest active shop until the Phase 7 landing), `/b/[slug]` (layout: `getTenant` → 404, per-shop metadata, `ShopFooter`) with `(client)/` holding the shop home, `/b/[slug]/services/[id]` and `/b/[slug]/employees/[id]`, `/bookings` (the user's bookings across all shops, each linking to its shop), `/profile`, legacy `/employees/[id]` and `/services/[id]` (308 to the record's shop), `/privacy-policy`, `/admin/login`, `/admin/(dashboard)/*` (admin only: dashboard, bookings, services, employees, expenses, barbershop), `/admin/atendente/*` (ATENDENTE or ADMIN: walk-in booking, bookings list), `/api/auth/[...nextauth]`.
- `proxy.ts` — Next 16's replacement for `middleware.ts`. It reads the JWT and limits EMPLOYEE users to `/` and `/profile`.
- `prisma/` — `schema.prisma`, migrations, seed. `prisma.config.ts` (repo root) holds the schema path, the seed command and the CLI datasource URL.
- `app/generated/prisma/` — generated Prisma client (gitignored). Server code imports from `@/app/generated/prisma/client`. Enums imported by Client Components come from `@/app/generated/prisma/enums`. Never import from `@prisma/client`.

## Domain model (prisma/schema.prisma)
- `User.role`: `CLIENT | EMPLOYEE | ATENDENTE | ADMIN`. A user has at most one `Employee` profile.
- `Employee` ↔ `BarbershopService` through `EmployeeService`. `EmployeeSchedule` has one row per `Weekday`, with `"HH:mm"` start/end strings and `isDayOff`.
- `Barbershop` is a singleton; code calls `prisma.barbershop.findFirst()`.
- `Booking`: `status` is `PENDING | COMPLETED | CANCELLED`, `paymentMethod` is optional (`CASH | PIX | CARD`). Each booking has at most one `Review`.
- `Expense` with a `ExpenseCategory` enum (values in Portuguese). `PasswordResetCode` stores the reset codes. `User` holds the login lockout fields.

## Conventions
- **UI copy, error messages and validation messages are in Portuguese (pt-BR)**; code identifiers are in English. Exception: the role name "atendente" appears in identifiers.
- Prettier: no semicolons, 2 spaces, tailwind class sorting. lint-staged runs `eslint --fix` and `prettier --write` on commit.
- Server actions: check auth first (`requireAdmin()` / `getServerSession(authOptions)`), validate with the shared zod schema through `safeParse`, `throw new Error("<pt-BR message>")` on failure, then call `revalidatePath(...)` for the affected routes.
- The session user is read as `(session.user as any).id/.role`, with an `eslint-disable-next-line @typescript-eslint/no-explicit-any` comment. NextAuth types are not augmented.
- **Decimal serialization:** convert Prisma `Decimal` fields (`price`, `amount`) with `Number()` before passing them to Client Components.
- **Cancelled bookings:** set `status: "CANCELLED"` instead of deleting (replace-booking does this). Queries for active bookings filter `status: { not: "CANCELLED" }`.
- ADMIN and ATENDENTE cannot create customer bookings. Enforce this in both the action and the UI. Walk-in bookings go through `create-walkin-booking.ts`.
- Forms are client components using `useForm` + `zodResolver(schema) as never`. They show toasts with `sonner` and call `router.refresh()` after a successful action.
- Pages are async Server Components. `searchParams`/`params` are **Promises** and must be awaited. Admin tables paginate with `?page=` and `AdminPagination`.
- Wrap slow, rarely changing reads in `unstable_cache`, and run independent queries with `Promise.all`. `require-admin.ts` wraps the session and user lookups in React `cache()` so they run once per request.
- Add a route-level `loading.tsx` skeleton when you add a new page.

## Gotchas
- **Timezone:** the business runs on `America/Sao_Paulo` (fixed UTC-3), but Vercel runs in UTC. For date bucketing and ranges, use the helpers in `app/_lib/timezone.ts` (`getBrazilDayRange`, `getBrazilWeekRange`, `getBrazilMonthRange`, `getBrazilDateKey`) instead of raw `Date` math.
- **Availability:** `getTimeList` in `app/_lib/time-list.ts` builds 30-minute-step slots inside the employee's schedule for that weekday. It rejects a slot if the service's full duration overlaps any existing booking.
- **Login lockout:** after 5 failed attempts the account locks for 10 minutes. This lives in the `check-login-attempt.ts` server action, called before `signIn`, because NextAuth v4 hides custom errors thrown from `authorize()`.
- **DB connection errors locally:** some networks (e.g. school wifi) block port 6543. If you see P1017 / `ConnectionClosed` locally while production works, the cause is the network, not the code. Use another network, or point the local `DATABASE_URL` at the 5432 URL.
- Remote images are allowed only from `utfs.io` and `images.unsplash.com` (`next.config.ts`).

## Git
- Conventional commits with a scope, enforced by git-commit-msg-linter: `feat(booking): ...`, `fix(admin): ...`, `style(atendente): ...`, `refactor`, `perf`, `chore`, `docs`. Common scopes: admin, auth, booking(s), employees, atendente, profile, reviews, barbershop, schema, home.
- Keep commits small and focused. Work happens directly on `main`.
