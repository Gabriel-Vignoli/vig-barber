import { requireShopRole } from "@/app/_lib/tenant"
import {
  getAdminBookings,
  AdminBookingFilter,
} from "@/app/_data/get-admin-bookings"
import AdminBookingsTable from "@/app/components/admin-bookings-table"
import AdminBookingFilters from "@/app/components/admin-booking-filters"
import AdminPagination from "@/app/components/admin-pagination"

interface AdminBookingsPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ filter?: string; page?: string }>
}

const VALID_FILTERS: AdminBookingFilter[] = [
  "all",
  "upcoming",
  "past",
  "cancelled",
]

const AdminBookingsPage = async ({
  params,
  searchParams,
}: AdminBookingsPageProps) => {
  const { slug } = await params
  const { shop } = await requireShopRole(slug, ["ADMIN"])
  const { filter, page } = await searchParams
  const activeFilter = VALID_FILTERS.includes(filter as AdminBookingFilter)
    ? (filter as AdminBookingFilter)
    : "all"
  const pageNumber = Number(page) > 0 ? Number(page) : 1
  const basePath = `/b/${slug}/admin/bookings`

  const { bookings, totalCount, totalPages, currentPage } =
    await getAdminBookings(shop.id, activeFilter, pageNumber)

  return (
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
        <AdminBookingFilters basePath={basePath} />
      </div>

      <AdminBookingsTable bookings={bookings} />

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={basePath}
      />
    </div>
  )
}

export default AdminBookingsPage
