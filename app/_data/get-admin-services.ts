import { prisma } from "../_lib/prisma"

const PAGE_SIZE = 10

export const getAdminServices = async (page: number = 1) => {
  const totalCount = await prisma.barbershopService.count()
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  const services = await prisma.barbershopService.findMany({
    orderBy: { name: "asc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  const serializedServices = services.map((service) => ({
    ...service,
    price: Number(service.price),
  }))

  return {
    services: serializedServices,
    totalCount,
    totalPages,
    currentPage,
  }
}
