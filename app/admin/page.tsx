import { redirectToShopArea } from "@/app/_lib/redirect-to-shop-area"

// Legacy /admin: redirects to the admin's shop dashboard
// TODO(Phase 8): remove the legacy redirects
const LegacyAdminPage = async ({ searchParams }: PageProps<"/admin">) => {
  return redirectToShopArea({
    area: "admin",
    roles: ["ADMIN"],
    searchParams: await searchParams,
  })
}

export default LegacyAdminPage
