import {
  getAdminBookings,
  AdminBookingFilter,
} from "../../../_data/get-admin-bookings"
import AdminBookingsTable from "../../../components/admin-bookings-table"
import AdminBookingFilters from "../../../components/admin-booking-filters"
import AdminPagination from "../../../components/admin-pagination"

interface AdminBookingsPageProps {
  searchParams: Promise<{ filter?: string; page?: string }>
}

const VALID_FILTERS: AdminBookingFilter[] = [
  "all",
  "upcoming",
  "past",
  "cancelled",
]

const AdminBookingsPage = async ({ searchParams }: AdminBookingsPageProps) => {
  const { filter, page } = await searchParams
  const activeFilter = VALID_FILTERS.includes(filter as AdminBookingFilter)
    ? (filter as AdminBookingFilter)
    : "all"
  const pageNumber = Number(page) > 0 ? Number(page) : 1

  const { bookings, totalCount, totalPages, currentPage } =
    await getAdminBookings(activeFilter, pageNumber)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold lg:text-2xl">Agendamentos</h1>
          <p className="text-muted-foreground text-sm">
            {totalCount} agendamento{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <AdminBookingFilters />
      </div>

      <AdminBookingsTable bookings={bookings} />

      <AdminPagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  )
}

export default AdminBookingsPage
