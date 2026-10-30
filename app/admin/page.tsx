import { redirectToShopAdmin } from "@/app/_lib/redirect-to-shop-admin"

// Legacy /admin: redirects to the admin's shop dashboard
// TODO(Phase 8): remove the legacy redirects
const LegacyAdminPage = async ({ searchParams }: PageProps<"/admin">) => {
  return redirectToShopAdmin(null, await searchParams)
}

export default LegacyAdminPage
