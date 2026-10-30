import { redirectToShopArea } from "@/app/_lib/redirect-to-shop-area"

// Legacy /admin/atendente/bookings: redirects to the bookings list of the
// user's shop
// TODO(Phase 8): remove the legacy redirects
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
