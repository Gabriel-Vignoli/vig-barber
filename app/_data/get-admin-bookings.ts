import { prisma } from "../_lib/prisma"

export type AdminBookingFilter = "all" | "upcoming" | "past" | "cancelled"

const PAGE_SIZE = 10

export const getAdminBookings = async (
  filter: AdminBookingFilter = "all",
  page: number = 1,
) => {
  const where =
    filter === "upcoming"
      ? {
          bookingDate: { gte: new Date() },
          status: { not: "CANCELLED" as const },
        }
      : filter === "past"
        ? {
            bookingDate: { lt: new Date() },
            status: { not: "CANCELLED" as const },
          }
        : filter === "cancelled"
          ? { status: "CANCELLED" as const }
          : {}

  const totalCount = await prisma.booking.count({ where })
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      employee: {
        include: { user: { select: { name: true } } },
      },
      barbershopService: { select: { name: true, price: true } },
    },
    orderBy: { bookingDate: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  const serializedBookings = bookings.map((booking) => ({
    ...booking,
    barbershopService: {
      ...booking.barbershopService,
      price: Number(booking.barbershopService.price),
    },
  }))

  return {
    bookings: serializedBookings,
    totalCount,
    totalPages,
    currentPage,
  }
}
