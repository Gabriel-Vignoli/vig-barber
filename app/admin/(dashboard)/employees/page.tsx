import { getAdminEmployees } from "@/app/_data/get-admin-employees"
import { getAllServices } from "@/app/_data/get-all-services"
import AdminEmployeesTable from "@/app/components/admin-employees-table"
import AdminPagination from "@/app/components/admin-pagination"

interface AdminEmployeesPageProps {
  searchParams: Promise<{ page?: string }>
}

const AdminEmployeesPage = async ({
  searchParams,
}: AdminEmployeesPageProps) => {
  const { page } = await searchParams
  const pageNumber = Number(page) > 0 ? Number(page) : 1

  const [{ employees, totalCount, totalPages, currentPage }, allServices] =
    await Promise.all([getAdminEmployees(pageNumber), getAllServices()])

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-xl font-bold lg:text-2xl">Funcionários</h1>
        <p className="text-muted-foreground text-sm">
          {totalCount} funcionário{totalCount !== 1 ? "s" : ""} cadastrado
          {totalCount !== 1 ? "s" : ""}
        </p>
      </div>

      <AdminEmployeesTable employees={employees} allServices={allServices} />

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/employees"
      />
    </div>
  )
}

export default AdminEmployeesPage
