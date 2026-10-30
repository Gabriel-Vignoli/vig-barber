import { requireShopRole } from "@/app/_lib/tenant"
import { getAdminExpenses } from "@/app/_data/get-admin-expenses"
import AdminExpensesTable from "@/app/components/admin-expenses-table"
import AdminPagination from "@/app/components/admin-pagination"

interface AdminExpensesPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

const AdminExpensesPage = async ({
  params,
  searchParams,
}: AdminExpensesPageProps) => {
  const { slug } = await params
  const { shop } = await requireShopRole(slug, ["ADMIN"])
  const { page } = await searchParams
  const pageNumber = Number(page) > 0 ? Number(page) : 1

  const { expenses, totalCount, totalPages, currentPage } =
    await getAdminExpenses(shop.id, pageNumber)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-xl font-bold lg:text-2xl xl:text-3xl">Despesas</h1>
        <p className="text-muted-foreground text-sm xl:text-base">
          {totalCount} despesa{totalCount !== 1 ? "s" : ""} cadastrada
          {totalCount !== 1 ? "s" : ""}
        </p>
      </div>

      <AdminExpensesTable slug={slug} expenses={expenses} />

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={`/b/${slug}/admin/expenses`}
      />
    </div>
  )
}

export default AdminExpensesPage
