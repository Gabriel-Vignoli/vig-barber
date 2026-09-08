import { prisma } from "../_lib/prisma"

export type AdminBookingFilter = "all" | "upcoming" | "past" | "cancelled"

export const getAdminBookings = async (filter: AdminBookingFilter = "all") => {
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
  })

  return bookings.map((booking) => ({
    ...booking,
    barbershopService: {
      ...booking.barbershopService,
      price: Number(booking.barbershopService.price),
    },
  }))
}
