import { getAdminServices } from "../../../_data/get-admin-services"
import AdminServicesTable from "../../../components/admin-services-table"
import AdminPagination from "../../../components/admin-pagination"

interface AdminServicesPageProps {
  searchParams: Promise<{ page?: string }>
}

const AdminServicesPage = async ({ searchParams }: AdminServicesPageProps) => {
  const { page } = await searchParams
  const pageNumber = Number(page) > 0 ? Number(page) : 1

  const { services, totalCount, totalPages, currentPage } =
    await getAdminServices(pageNumber)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-xl font-bold lg:text-2xl">Serviços</h1>
        <p className="text-muted-foreground text-sm">
          {totalCount} serviço{totalCount !== 1 ? "s" : ""} cadastrado
          {totalCount !== 1 ? "s" : ""}
        </p>
      </div>

      <AdminServicesTable services={services} />

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/services"
      />
    </div>
  )
}

export default AdminServicesPage
