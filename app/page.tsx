import { getServerSession } from "next-auth"
import { notFound, redirect } from "next/navigation"
import Header from "./components/header"
import EmployeeDashboard from "./components/employee-dashboard"
import { authOptions } from "./_lib/auth"
import { prisma } from "./_lib/prisma"
import {
  getEmployeeUpcomingBookings,
  getEmployeeConcludedBookings,
} from "./_data/get-employee-bookings"

export default async function Home() {
  const session = await getServerSession(authOptions)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (session?.user as any)?.role

  // TODO(Phase 4b): the employee dashboard moves to /b/[slug]/staff
  if (userRole === "EMPLOYEE") {
    const [upcomingBookings, concludedBookings] = await Promise.all([
      getEmployeeUpcomingBookings(),
      getEmployeeConcludedBookings(),
    ])

    return (
      <div>
        <Header />
        <EmployeeDashboard
          employeeName={session?.user?.name ?? "Funcionário"}
          upcomingBookings={upcomingBookings}
          concludedBookings={concludedBookings}
        />
      </div>
    )
  }

  // TODO(Phase 7): replace with the landing page + shop finder. Until then,
  // send everyone else to the oldest active shop.
  const shop = await prisma.barbershop.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: { slug: true },
  })

  if (!shop) {
    notFound()
  }

  redirect(`/b/${shop.slug}`)
}
