import { prisma } from "../_lib/prisma"

const PAGE_SIZE = 10

export const getAdminEmployees = async (page: number = 1) => {
  const totalCount = await prisma.employee.count()
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  const employees = await prisma.employee.findMany({
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
