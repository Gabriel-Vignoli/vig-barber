import { prisma } from "../_lib/prisma"

export type AdminBookingFilter = "all" | "upcoming" | "past" | "cancelled"

const PAGE_SIZE = 10

export const getAdminBookings = async (
  filter: AdminBookingFilter = "all",
  page: number = 1,
) => {
  const include = {
    user: { select: { id: true, name: true, email: true, image: true } },
    employee: {
      include: { user: { select: { name: true } } },
    },
    barbershopService: { select: { name: true, price: true } },
  }

  const serialize = <T extends { barbershopService: { price: unknown } }>(
    booking: T,
  ) => ({
    ...booking,
    barbershopService: {
      ...booking.barbershopService,
      price: Number(booking.barbershopService.price),
    },
  })

  if (filter === "all") {
    const now = new Date()

    const pendingWhere = {
      status: "PENDING" as const,
      bookingDate: { gte: now },
    }
    const concludedWhere = {
      status: { not: "CANCELLED" as const },
      OR: [{ status: "COMPLETED" as const }, { bookingDate: { lt: now } }],
    }

    const [pendingBookings, concludedBookings] = await Promise.all([
      prisma.booking.findMany({
        where: pendingWhere,
        include,
        orderBy: { bookingDate: "asc" },
      }),
      prisma.booking.findMany({
        where: concludedWhere,
        include,
        orderBy: { bookingDate: "desc" },
      }),
    ])

    const allBookings = [...pendingBookings, ...concludedBookings]
    const totalCount = allBookings.length
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
    const currentPage = Math.min(Math.max(1, page), totalPages)

    const pageBookings = allBookings
      .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
      .map(serialize)

    return {
      bookings: pageBookings,
      totalCount,
      totalPages,
      currentPage,
    }
  }

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
        : { status: "CANCELLED" as const }

  const totalCount = await prisma.booking.count({ where })
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  const bookings = await prisma.booking.findMany({
    where,
    include,
    orderBy: { bookingDate: "asc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  return {
    bookings: bookings.map(serialize),
    totalCount,
    totalPages,
    currentPage,
  }
}
