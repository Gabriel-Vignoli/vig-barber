# Vig Barber

A full-stack barbershop booking platform built with Next.js, TypeScript, Prisma, and NextAuth. Clients can browse barbers, book services, and leave reviews, while admins manage bookings, services, employees, and expenses through a dedicated dashboard.

## ✨ Features

**Customer-facing**
- Authentication via Google or email/password (NextAuth), with account lockout after repeated failed login attempts
- Browse barbers and services, with per-employee availability and working hours
- Book a service with a specific employee, date, and time slot
- Conflict detection when booking a time slot that overlaps an existing booking
- Booking summary and confirmation step before finalizing
- Leave and manage reviews for completed bookings
- View upcoming and past bookings
- Editable profile (name, password)

**Admin panel** (role-gated, separate `/admin` login)
- Dashboard with bookings/revenue breakdown by day, week, or month
- Manage services (create, edit, delete)
- Manage employees, their assigned services, and weekly schedules
- View and filter all customer bookings
- Track business expenses by category
- Admin accounts are blocked from booking as customers, and are redirected to the admin login when appropriate

**General**
- Responsive UI built with Tailwind CSS and Base UI components
- Transactional email (password reset) via Resend
- Charts and analytics via Recharts

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router, Turbopack)
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** NextAuth (Google + Credentials)
- **Styling:** Tailwind CSS + Base UI
- **Email:** Resend
- **Charts:** Recharts
- **Deployment:** Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- A PostgreSQL database (local, or a hosted service like Supabase or Neon)

### Setup

```bash
# Clone the repository
git clone https://github.com/Gabriel-Vignoli/vig-barber.git

# Move into the project folder
cd vig-barber

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Fill in the `.env` file with your credentials:

```env
# Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
DATABASE_URL=""

# Connect to Postgres via the shared session-mode pooler (used for migrations)
DIRECT_URL=""

# Google OAuth provider (NextAuth)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# NextAuth session secret
NEXT_AUTH_SECRET=""

# Resend (transactional email)
RESEND_API_KEY=""
```

```bash
# Run Prisma migrations
npx prisma migrate dev

# Seed the database with sample data (optional)
npx prisma db seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure
vig-barber/
├── app/
│ ├── _actions/ # Server Actions
│ ├── _constants/ # App-wide constants
│ ├── _data/ # Data-fetching helpers
│ ├── _lib/ # Config and utilities (auth, prisma client, validations, etc.)
│ ├── _providers/ # Context providers
│ ├── admin/ # Admin panel routes (dashboard, bookings, services, employees, expenses)
│ ├── api/ # API routes
│ ├── employees/ # Employee profile and booking pages
│ ├── bookings/ # Customer bookings pages
│ ├── profile/ # User profile pages
│ ├── components/ # Reusable components
│ ├── globals.css
│ ├── layout.tsx
│ └── page.tsx
├── prisma/ # Database schema, migrations, and seed script
└── public/ # Static assets



## 🧠 Technical Notes

- **Prisma `Decimal` serialization:** Prisma's `Decimal` type isn't directly serializable across the Server → Client Component boundary in Next.js, so it's explicitly converted to `number` in components like `BookingItem`, `ServiceItem`, and `BookingSummary`.
- **Timezone handling:** Date-bucketing for the admin dashboard uses dedicated helpers (`getBrazilDayRange`, `getBrazilWeekRange`, etc.) rather than raw `Date` comparisons, since plain date handling reads server-local time and breaks between local development (already BRT) and Vercel's UTC runtime.
- **Login lockout:** Failed login attempts are tracked server-side via a dedicated Server Action rather than inside NextAuth's `authorize()` callback, since NextAuth v4 masks custom error messages returned from `authorize()` and always reports a generic `CredentialsSignin` error to the client.

## 📌 Status

Actively in development.

## 👤 Author

**Gabriel Vignoli** — [GitHub](https://github.com/Gabriel-Vignoli) · [LinkedIn](https://www.linkedin.com/in/gabriel-vignoli/)