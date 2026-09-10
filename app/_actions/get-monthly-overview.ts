"use server"

import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"
import {
  getBrazilDateKey,
  getBrazilMonthRange,
  getDaysInBrazilMonth,
} from "../_lib/timezone"

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
  const { rangeStart, rangeEnd, year, month } = getBrazilMonthRange(now)

  const bookings = await prisma.booking.findMany({
    where: {
      bookingDate: { gte: rangeStart, lt: rangeEnd },
      status: { not: "CANCELLED" },
    },
    include: { barbershopService: { select: { price: true } } },
  })

  const daysInMonth = getDaysInBrazilMonth(year, month)
  const byDate = new Map<string, MonthlyOverviewDataPoint>()

  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
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
    const dateKey = getBrazilDateKey(booking.bookingDate)
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
