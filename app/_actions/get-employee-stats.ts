"use server"

import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"
import {
  getBrazilDayRange,
  getBrazilWeekRange,
  getBrazilMonthRange,
} from "../_lib/timezone"

export type StatsPeriod = "day" | "week" | "month"

export const getEmployeeStats = async (
  employeeId: string,
  period: StatsPeriod,
) => {
  await requireAdmin()

  const now = new Date()
  const { rangeStart, rangeEnd } =
    period === "day"
      ? getBrazilDayRange(now)
      : period === "week"
        ? getBrazilWeekRange(now)
        : getBrazilMonthRange(now)

  const bookings = await prisma.booking.findMany({
    where: {
      employeeId,
      bookingDate: { gte: rangeStart, lt: rangeEnd },
      status: { not: "CANCELLED" },
    },
    include: { barbershopService: { select: { price: true } } },
  })

  const totalBookings = bookings.length
  const totalRevenue = bookings.reduce(
    (acc, booking) => acc + Number(booking.barbershopService.price),
    0,
  )

  return { totalBookings, totalRevenue }
}
