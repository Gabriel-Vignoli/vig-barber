"use server"

import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"

export type StatsPeriod = "day" | "week" | "month"

export const getEmployeeStats = async (
  employeeId: string,
  period: StatsPeriod,
) => {
  await requireAdmin()

  const now = new Date()
  let start: Date
  let end: Date

  if (period === "day") {
    start = startOfDay(now)
    end = endOfDay(now)
  } else if (period === "week") {
    start = startOfWeek(now, { weekStartsOn: 0 })
    end = endOfWeek(now, { weekStartsOn: 0 })
  } else {
    start = startOfMonth(now)
    end = endOfMonth(now)
  }

  const bookings = await prisma.booking.findMany({
    where: {
      employeeId,
      bookingDate: { gte: start, lte: end },
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
