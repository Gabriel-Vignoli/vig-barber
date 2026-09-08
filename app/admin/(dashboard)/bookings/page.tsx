import {
  getAdminBookings,
  AdminBookingFilter,
} from "../../../_data/get-admin-bookings"
import AdminBookingsTable from "../../../components/admin-bookings-table"
import AdminBookingFilters from "../../../components/admin-booking-filters"

interface AdminBookingsPageProps {
  searchParams: Promise<{ filter?: string }>
}

const VALID_FILTERS: AdminBookingFilter[] = [
  "all",
  "upcoming",
  "past",
  "cancelled",
]

const AdminBookingsPage = async ({ searchParams }: AdminBookingsPageProps) => {
  const { filter } = await searchParams
  const activeFilter = VALID_FILTERS.includes(filter as AdminBookingFilter)
    ? (filter as AdminBookingFilter)
    : "all"

  const bookings = await getAdminBookings(activeFilter)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold lg:text-2xl">Agendamentos</h1>
        <AdminBookingFilters />
      </div>

      <AdminBookingsTable bookings={bookings} />
    </div>
  )
}

export default AdminBookingsPage
