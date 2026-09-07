import { requireAdmin } from "../../_lib/require-admin"
import AdminHeader from "../../components/admin-header"

const AdminDashboardLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  const admin = await requireAdmin()

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader adminName={admin.name ?? "Admin"} />
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default AdminDashboardLayout
