import { getBillingPath, requireShopRole } from "@/app/_lib/tenant"
import { getBillingState } from "@/app/_lib/billing"
import { getUserName } from "@/app/_data/get-user-name"
import AdminHeader from "@/app/components/admin-header"
import BillingBanner from "@/app/components/billing-banner"

// The layout only renders chrome, so it checks the ADMIN role without the
// billing gate: layouts get no pathname, so a gated layout would also redirect
// the billing page to itself. Every admin page calls requireShopRole itself
// (layouts are not re-run on client navigation, so the pages are the real
// gate anyway), and the billing page opts out with allowUnpaid.
const AdminDashboardLayout = async ({
  children,
  params,
}: LayoutProps<"/b/[slug]/admin">) => {
  const { slug } = await params
  const { shop, userId } = await requireShopRole(slug, ["ADMIN"], {
    allowUnpaid: true,
  })
  const adminName = await getUserName(userId)
  const billingState = getBillingState(shop, new Date())

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader adminName={adminName ?? "Admin"} slug={slug} />
      <BillingBanner billingPath={getBillingPath(slug)} state={billingState} />
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default AdminDashboardLayout
