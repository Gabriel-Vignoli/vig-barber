import { redirectToShopArea } from "@/app/_lib/redirect-to-shop-area"

// Legacy /admin/atendente: redirects to the front desk of the user's shop
// TODO(Phase 8): remove the legacy redirects
const LegacyAtendentePage = async ({
  searchParams,
}: PageProps<"/admin/atendente">) => {
  return redirectToShopArea({
    area: "atendente",
    roles: ["ATENDENTE", "ADMIN"],
    searchParams: await searchParams,
  })
}

export default LegacyAtendentePage
