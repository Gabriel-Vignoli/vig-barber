import { requireShopRole } from "@/app/_lib/tenant"
import { getAdminServices } from "@/app/_data/get-admin-services"
import AdminServicesTable from "@/app/components/admin-services-table"
import AdminPagination from "@/app/components/admin-pagination"

interface AdminServicesPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

const AdminServicesPage = async ({
  params,
  searchParams,
}: AdminServicesPageProps) => {
  const { slug } = await params
  const { shop } = await requireShopRole(slug, ["ADMIN"])
  const { page } = await searchParams
  const pageNumber = Number(page) > 0 ? Number(page) : 1

  const { services, totalCount, totalPages, currentPage } =
    await getAdminServices(shop.id, pageNumber)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-xl font-bold lg:text-2xl xl:text-3xl">Serviços</h1>
        <p className="text-muted-foreground text-sm xl:text-base">
          {totalCount} serviço{totalCount !== 1 ? "s" : ""} cadastrado
          {totalCount !== 1 ? "s" : ""}
        </p>
      </div>

      <AdminServicesTable slug={slug} services={services} />

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={`/b/${slug}/admin/services`}
      />
    </div>
  )
}

export default AdminServicesPage
