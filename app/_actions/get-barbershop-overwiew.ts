"use server"

import { subDays, startOfDay, endOfDay, format } from "date-fns"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"

export type OverviewRange = "7d" | "30d" | "90d"

export interface OverviewDataPoint {
  date: string
  bookings: number
  revenue: number
}

const RANGE_DAYS: Record<OverviewRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
}

export const getBarbershopOverview = async (
  range: OverviewRange,
): Promise<OverviewDataPoint[]> => {
  await requireAdmin()

  const days = RANGE_DAYS[range]
  const rangeStart = startOfDay(subDays(new Date(), days - 1))
  const rangeEnd = endOfDay(new Date())

  const bookings = await prisma.booking.findMany({
    where: {
      bookingDate: { gte: rangeStart, lte: rangeEnd },
      status: { not: "CANCELLED" },
    },
    include: { barbershopService: { select: { price: true } } },
  })

  const byDate = new Map<string, { bookings: number; revenue: number }>()

  for (let i = 0; i < days; i++) {
    const date = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd")
    byDate.set(date, { bookings: 0, revenue: 0 })
  }

  for (const booking of bookings) {
    const dateKey = format(booking.bookingDate, "yyyy-MM-dd")
    const entry = byDate.get(dateKey)
    if (entry) {
      entry.bookings += 1
      entry.revenue += Number(booking.barbershopService.price)
    }
  }

  return Array.from(byDate.entries()).map(([date, values]) => ({
    date,
    ...values,
  }))
}
