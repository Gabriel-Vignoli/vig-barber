import { redirectToShopArea } from "@/app/_lib/redirect-to-shop-area"

// Legacy /admin/atendente/bookings: redirects to the bookings list of the
// user's shop
// TODO(legacy): kept after the migration, remove once the SaaS has been
// live for a while
const LegacyAtendenteBookingsPage = async ({
  searchParams,
}: PageProps<"/admin/atendente/bookings">) => {
  return redirectToShopArea({
    area: "atendente",
    roles: ["ATENDENTE", "ADMIN"],
    section: "bookings",
    searchParams: await searchParams,
  })
}

export default LegacyAtendenteBookingsPage
