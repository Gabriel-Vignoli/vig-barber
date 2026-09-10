"use server"

import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"

export interface MonthlyOverviewDataPoint {
  date: string
  concludedBookings: number
  upcomingBookings: number
  concludedRevenue: number
  upcomingRevenue: number
}

export interface MonthlyOverviewResult {
  data: MonthlyOverviewDataPoint[]
  totalConcludedBookings: number
  totalConcludedRevenue: number
}

export const getMonthlyOverview = async (): Promise<MonthlyOverviewResult> => {
  await requireAdmin()

  const now = new Date()
  const rangeStart = startOfMonth(now)
  const rangeEnd = endOfMonth(now)

  const bookings = await prisma.booking.findMany({
    where: {
      bookingDate: { gte: rangeStart, lte: rangeEnd },
      status: { not: "CANCELLED" },
    },
    include: { barbershopService: { select: { price: true } } },
  })

  const byDate = new Map<string, MonthlyOverviewDataPoint>()

  for (const day of eachDayOfInterval({ start: rangeStart, end: rangeEnd })) {
    const key = format(day, "yyyy-MM-dd")
    byDate.set(key, {
      date: key,
      concludedBookings: 0,
      upcomingBookings: 0,
      concludedRevenue: 0,
      upcomingRevenue: 0,
    })
  }

  let totalConcludedBookings = 0
  let totalConcludedRevenue = 0

  for (const booking of bookings) {
    const dateKey = format(booking.bookingDate, "yyyy-MM-dd")
    const entry = byDate.get(dateKey)
    if (!entry) continue

    const price = Number(booking.barbershopService.price)
    const isConcluded =
      booking.status === "COMPLETED" || booking.bookingDate < now

    if (isConcluded) {
      entry.concludedBookings += 1
      entry.concludedRevenue += price
      totalConcludedBookings += 1
      totalConcludedRevenue += price
    } else {
      entry.upcomingBookings += 1
      entry.upcomingRevenue += price
    }
  }

  return {
    data: Array.from(byDate.values()),
    totalConcludedBookings,
    totalConcludedRevenue,
  }
}
