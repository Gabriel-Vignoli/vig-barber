import { requireAtendente } from "@/app/_lib/require-admin"
import {
  getAdminBookings,
  AdminBookingFilter,
} from "@/app/_data/get-admin-bookings"
import AtendenteHeader from "@/app/components/atendente-header"
import AdminBookingsTable from "@/app/components/admin-bookings-table"
import AdminBookingFilters from "@/app/components/admin-booking-filters"
import AdminPagination from "@/app/components/admin-pagination"

interface AtendenteBookingsPageProps {
  searchParams: Promise<{ filter?: string; page?: string }>
}

const VALID_FILTERS: AdminBookingFilter[] = [
  "all",
  "upcoming",
  "past",
  "cancelled",
]

const AtendenteBookingsPage = async ({
  searchParams,
}: AtendenteBookingsPageProps) => {
  const user = await requireAtendente()
  const { filter, page } = await searchParams

  const activeFilter = VALID_FILTERS.includes(filter as AdminBookingFilter)
    ? (filter as AdminBookingFilter)
    : "all"
  const pageNumber = Number(page) > 0 ? Number(page) : 1

  const { bookings, totalCount, totalPages, currentPage } =
    await getAdminBookings(activeFilter, pageNumber)

  return (
    <>
      <AtendenteHeader atendenteName={user.name ?? "Atendente"} />
      <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold lg:text-2xl xl:text-3xl">
              Agendamentos
            </h1>
            <p className="text-muted-foreground text-sm xl:text-base">
              {totalCount} agendamento{totalCount !== 1 ? "s" : ""}
            </p>
          </div>
          <AdminBookingFilters basePath="/admin/atendente/bookings" />
        </div>

        <AdminBookingsTable bookings={bookings} />

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath="/admin/atendente/bookings"
        />
      </div>
    </>
  )
}

export default AtendenteBookingsPage
