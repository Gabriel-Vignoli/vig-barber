import { prisma } from "../_lib/prisma"

const PAGE_SIZE = 10

// Barbeiros only: the shop's Employee rows whose user is not an atendente of
// this shop (an ADMIN who also cuts hair still shows up here)
const employeesWhere = (shopId: string) => ({
  barbershopId: shopId,
  user: {
    memberships: {
      none: { barbershopId: shopId, role: "ATENDENTE" as const },
    },
  },
})

export const getAdminEmployees = async (shopId: string, page: number = 1) => {
  const where = employeesWhere(shopId)

  const totalCount = await prisma.employee.count({ where })
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  const employees = await prisma.employee.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      services: {
        include: { service: { select: { id: true, name: true } } },
      },
      schedules: true,
      _count: { select: { bookings: true } },
    },
  })

  return { employees, totalCount, totalPages, currentPage }
}
