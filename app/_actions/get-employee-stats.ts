"use server"

import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"
import {
  getBrazilDayRange,
  getBrazilWeekRange,
  getBrazilMonthRange,
} from "../_lib/timezone"

export type StatsPeriod = "day" | "week" | "month" | "all"

export const getEmployeeStats = async (
  employeeId: string,
  period: StatsPeriod,
) => {
  await requireAdmin()

  const now = new Date()

  const dateFilter =
    period === "all"
      ? undefined
      : {
          gte:
            period === "day"
              ? getBrazilDayRange(now).rangeStart
              : period === "week"
                ? getBrazilWeekRange(now).rangeStart
                : getBrazilMonthRange(now).rangeStart,
          lt:
            period === "day"
              ? getBrazilDayRange(now).rangeEnd
              : period === "week"
                ? getBrazilWeekRange(now).rangeEnd
                : getBrazilMonthRange(now).rangeEnd,
        }

  const bookings = await prisma.booking.findMany({
    where: {
      employeeId,
      ...(dateFilter && { bookingDate: dateFilter }),
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
