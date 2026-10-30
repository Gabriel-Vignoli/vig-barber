import { requireShopRole } from "@/app/_lib/tenant"
import { getUserName } from "@/app/_data/get-user-name"
import AdminHeader from "@/app/components/admin-header"

const AdminDashboardLayout = async ({
  children,
  params,
}: LayoutProps<"/b/[slug]/admin">) => {
  const { slug } = await params
  const { userId } = await requireShopRole(slug, ["ADMIN"])
  const adminName = await getUserName(userId)

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader adminName={adminName ?? "Admin"} slug={slug} />
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default AdminDashboardLayout
