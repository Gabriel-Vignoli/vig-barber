import { prisma } from "../_lib/prisma"

// The signed-in user's active Employee row in this shop (a barber can work
// in several shops, one row each)
export const getShopEmployeeForUser = (shopId: string, userId: string) =>
  prisma.employee.findFirst({
    where: { userId, barbershopId: shopId, isActive: true },
    select: { id: true },
  })

const bookingInclude = {
  user: { select: { name: true, image: true } },
  barbershopService: { select: { name: true, durationInMinutes: true } },
} as const

export const getEmployeeUpcomingBookings = (
  shopId: string,
  employeeId: string,
) =>
  prisma.booking.findMany({
    where: {
      barbershopId: shopId,
      employeeId,
      bookingDate: { gte: new Date() },
      status: { not: "CANCELLED" },
    },
    include: bookingInclude,
    orderBy: { bookingDate: "asc" },
  })

export const getEmployeeConcludedBookings = (
  shopId: string,
  employeeId: string,
) =>
  prisma.booking.findMany({
    where: {
      barbershopId: shopId,
      employeeId,
      status: { not: "CANCELLED" },
      OR: [{ status: "COMPLETED" }, { bookingDate: { lt: new Date() } }],
    },
    include: bookingInclude,
    orderBy: { bookingDate: "desc" },
  })
