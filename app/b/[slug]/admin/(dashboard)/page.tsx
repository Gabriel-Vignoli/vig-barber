import { requireShopRole } from "@/app/_lib/tenant"
import { getUserName } from "@/app/_data/get-user-name"
import AdminDashboard from "@/app/components/admin-dashboard"

interface AdminDashboardPageProps {
  params: Promise<{ slug: string }>
}

const AdminDashboardPage = async ({ params }: AdminDashboardPageProps) => {
  const { slug } = await params
  const { userId } = await requireShopRole(slug, ["ADMIN"])
  const adminName = await getUserName(userId)

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-xl font-bold lg:text-2xl xl:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground text-sm xl:text-base">
          Bem-vindo, {adminName}.
        </p>
      </div>

      <AdminDashboard slug={slug} />
    </div>
  )
}

export default AdminDashboardPage
