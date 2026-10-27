@AGENTS.md

# Vig Barber — project context

Full-stack booking platform for a single barbershop. Clients book services with a specific barber. Staff work in role-specific areas: employee dashboard, front-desk walk-in screen, admin panel.

## Stack
- Next.js 16.2 (App Router, Turbopack), React 19.2, TypeScript (path alias `@/*` → repo root)
- Prisma 6 + PostgreSQL (Supabase). `DATABASE_URL` = pooled, `DIRECT_URL` = migrations
- NextAuth **v4** (JWT sessions) with Google + Credentials providers and `@auth/prisma-adapter`
- Tailwind CSS v4 + shadcn (style `base-nova`, built on **Base UI**, not Radix) + lucide icons
- react-hook-form + zod v4, sonner toasts, Recharts, date-fns (`ptBR` locale), Resend email
- Deployed on Vercel (UTC runtime)

## Commands
- `npm run dev` / `npm run build` / `npm run lint`
- `npx prisma migrate dev` · `npx prisma db seed` (runs `prisma/seed.ts` via ts-node)
- `postinstall` runs `prisma generate`
- No test suite exists. Check your work with `npm run lint` and `npm run build`.

## Layout
- `app/_actions/` — Server Actions (`"use server"`), one exported function per file, kebab-case filename (`create-booking.ts` → `createBooking`). Both mutations and client-called queries live here.
- `app/_data/` — server-side data fetchers used by pages (`get-admin-*`, `get-*-bookings`).
- `app/_lib/` — `auth.ts` (authOptions), `prisma.ts` (singleton client), `require-admin.ts` (`requireAdmin`, `requireAtendente`), `timezone.ts`, `time-list.ts` (slot availability), `resend.ts`, `utils.ts` (`cn`), `validations/*.ts` (zod schemas + inferred `*FormValues` types).
- `app/components/` — flat folder of feature components. `app/components/ui/` holds the shadcn/Base UI primitives.
- `app/_providers/`, `app/_constants/`
- Routes: `/` (client home, or the employee dashboard when the user is EMPLOYEE), `/bookings`, `/profile`, `/employees/[id]`, `/services/[id]`, `/privacy-policy`, `/admin/login`, `/admin/(dashboard)/*` (admin only: dashboard, bookings, services, employees, expenses, barbershop), `/admin/atendente/*` (ATENDENTE or ADMIN: walk-in booking, bookings list), `/api/auth/[...nextauth]`.
- `proxy.ts` — Next 16's replacement for `middleware.ts`. It reads the JWT and limits EMPLOYEE users to `/` and `/profile`.
- `prisma/` — `schema.prisma`, migrations, seed.

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
- Remote images are allowed only from `utfs.io` and `images.unsplash.com` (`next.config.ts`).

## Git
- Conventional commits with a scope, enforced by git-commit-msg-linter: `feat(booking): ...`, `fix(admin): ...`, `style(atendente): ...`, `refactor`, `perf`, `chore`, `docs`. Common scopes: admin, auth, booking(s), employees, atendente, profile, reviews, barbershop, schema, home.
- Keep commits small and focused. Work happens directly on `main`.
