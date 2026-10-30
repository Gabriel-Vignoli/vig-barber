import { redirect } from "next/navigation"
import { requireShopRole } from "@/app/_lib/tenant"
import { getUserName } from "@/app/_data/get-user-name"
import {
  getEmployeeConcludedBookings,
  getEmployeeUpcomingBookings,
  getShopEmployeeForUser,
} from "@/app/_data/get-employee-bookings"
import Header from "@/app/components/header"
import EmployeeDashboard from "@/app/components/employee-dashboard"

interface StaffPageProps {
  params: Promise<{ slug: string }>
}

// The barber's own bookings in this shop. ADMIN is allowed too, for owners
// who also cut hair (they have an Employee row but an ADMIN membership).
const StaffPage = async ({ params }: StaffPageProps) => {
  const { slug } = await params
  const { shop, userId } = await requireShopRole(slug, ["EMPLOYEE", "ADMIN"])

  const employee = await getShopEmployeeForUser(shop.id, userId)

  if (!employee) {
    redirect(`/b/${slug}`)
  }

  const [employeeName, upcomingBookings, concludedBookings] = await Promise.all(
    [
      getUserName(userId),
      getEmployeeUpcomingBookings(shop.id, employee.id),
      getEmployeeConcludedBookings(shop.id, employee.id),
    ],
  )

  return (
    <div>
      <Header />
      <EmployeeDashboard
        employeeName={employeeName ?? "Funcionário"}
        upcomingBookings={upcomingBookings}
        concludedBookings={concludedBookings}
      />
    </div>
  )
}

export default StaffPage
