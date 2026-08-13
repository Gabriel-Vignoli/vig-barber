vig-barber

A barbershop booking system built with Next.js, TypeScript, Prisma, and NextAuth. It allows clients to book appointments for services (haircuts, beard trims, etc.) and lets the barbershop manage bookings in a simple, organized way.

✨ Features
User authentication with NextAuth
Service registration and listing
Booking system with date and time selection
Booking summary before confirmation
Admin panel for managing available time slots
Responsive UI with Tailwind CSS
🛠️ Tech Stack
Framework: Next.js
Language: TypeScript
ORM: Prisma
Authentication: NextAuth
Styling: Tailwind CSS
Database: PostgreSQL
Deployment: Vercel
🚀 Getting Started
Prerequisites
Node.js installed
PostgreSQL database configured (local or a service like Neon/Supabase)
Setup
bash
# Clone the repository
git clone https://github.com/Gabriel-Vignoli/vig-barber.git

# Move into the project folder
cd vig-barber

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

Fill in the .env file with your credentials:

env
# Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
DATABASE_URL=""

# Connect to Postgres via the shared session-mode pooler (used for migrations)
DIRECT_URL="

# Connect with next auth google provider
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

NEXT_AUTH_SECRET=""
bash
# Run Prisma migrations
npx prisma migrate dev

# Start the development server
npm run dev

Open http://localhost:3000 in your browser.

📁 Project Structure
vig-barber/
├── app/
│   ├── _actions/       # Server Actions
│   ├── _constants/     # App-wide constants
│   ├── _lib/           # Config and utilities (auth, prisma client, etc.)
│   ├── _providers/     # Context providers
│   ├── api/            # API routes
│   ├── barbershops/    # Barbershop-related pages
│   ├── bookings/       # Booking-related pages
│   ├── components/     # Reusable components
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── prisma/             # Database schema and migrations
└── public/             # Static assets
🧠 Technical Challenges

One of the main challenges was handling the serialization of Prisma's Decimal type when passing data from Server Components to Client Components in Next.js, which required explicit conversion to number/string in components like BookingItem, ServiceItem, and BookingSummary.

📌 Status

Actively in development.

👤 Author

Gabriel Vignoli GitHub · LinkedIn