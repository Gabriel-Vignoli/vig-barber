import { requireShopRole } from "@/app/_lib/tenant"
import { getAdminEmployees } from "@/app/_data/get-admin-employees"
import { getAdminAtendentes } from "@/app/_data/get-admin-atendentes"
import { getAllServices } from "@/app/_data/get-all-services"
import AdminEmployeesTable from "@/app/components/admin-employees-table"
import AdminAtendentesTable from "@/app/components/admin-atendentes-table"
import AdminPagination from "@/app/components/admin-pagination"

interface AdminEmployeesPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

const AdminEmployeesPage = async ({
  params,
  searchParams,
}: AdminEmployeesPageProps) => {
  const { slug } = await params
  const { shop } = await requireShopRole(slug, ["ADMIN"])
  const { page } = await searchParams
  const pageNumber = Number(page) > 0 ? Number(page) : 1

  const [
    { employees, totalCount, totalPages, currentPage },
    { atendentes, totalCount: atendentesCount },
    allServices,
  ] = await Promise.all([
    getAdminEmployees(shop.id, pageNumber),
    getAdminAtendentes(shop.id),
    getAllServices(shop.id),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 lg:p-8">
      <div>
        <h1 className="text-xl font-bold lg:text-2xl xl:text-3xl">
          Funcionários
        </h1>
        <p className="text-muted-foreground text-sm xl:text-base">
          {totalCount} barbeiro{totalCount !== 1 ? "s" : ""} • {atendentesCount}{" "}
          atendente{atendentesCount !== 1 ? "s" : ""}
        </p>
      </div>

      <section className="space-y-4">
        <AdminEmployeesTable
          slug={slug}
          employees={employees}
          totalCount={totalCount}
          allServices={allServices}
        />

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={`/b/${slug}/admin/employees`}
        />
      </section>

      <section>
        <AdminAtendentesTable
          slug={slug}
          atendentes={atendentes}
          totalCount={atendentesCount}
        />
      </section>
    </div>
  )
}

export default AdminEmployeesPage
