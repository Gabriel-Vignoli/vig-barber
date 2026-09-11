import { getAdminExpenses } from "../../../_data/get-admin-expenses"
import AdminExpensesTable from "../../../components/admin-expenses-table"
import AdminPagination from "../../../components/admin-pagination"

interface AdminExpensesPageProps {
  searchParams: Promise<{ page?: string }>
}

const AdminExpensesPage = async ({ searchParams }: AdminExpensesPageProps) => {
  const { page } = await searchParams
  const pageNumber = Number(page) > 0 ? Number(page) : 1

  const { expenses, totalCount, totalPages, currentPage } =
    await getAdminExpenses(pageNumber)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-xl font-bold lg:text-2xl">Despesas</h1>
        <p className="text-muted-foreground text-sm">
          {totalCount} despesa{totalCount !== 1 ? "s" : ""} cadastrada
          {totalCount !== 1 ? "s" : ""}
        </p>
      </div>

      <AdminExpensesTable expenses={expenses} />

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/expenses"
      />
    </div>
  )
}

export default AdminExpensesPage
