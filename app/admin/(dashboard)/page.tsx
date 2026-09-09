import { requireAdmin } from "@/app/_lib/require-admin"
import AdminDashboard from "@/app/components/admin-dashboard"

const AdminDashboardPage = async () => {
  const admin = await requireAdmin()

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-xl font-bold lg:text-2xl">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Bem-vindo, {admin.name}.
        </p>
      </div>

      <AdminDashboard />
    </div>
  )
}

export default AdminDashboardPage
