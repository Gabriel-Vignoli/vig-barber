import { redirectToShopArea } from "@/app/_lib/redirect-to-shop-area"

// Legacy /admin: redirects to the admin's shop dashboard
// TODO(legacy): kept after the migration, remove once the SaaS has been
// live for a while
const LegacyAdminPage = async ({ searchParams }: PageProps<"/admin">) => {
  return redirectToShopArea({
    area: "admin",
    roles: ["ADMIN"],
    searchParams: await searchParams,
  })
}

export default LegacyAdminPage
