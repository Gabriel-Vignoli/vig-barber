"use server"

import { assertShopRole } from "../_lib/tenant"
import { prisma } from "../_lib/prisma"
import { getBrazilDateKey, getBrazilDayRange } from "../_lib/timezone"

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

const DAY_MS = 24 * 60 * 60 * 1000

export const getBarbershopOverview = async (
  slug: string,
  range: OverviewRange,
): Promise<OverviewDataPoint[]> => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  const days = RANGE_DAYS[range]
  // Brazil days (fixed UTC-3), not the UTC days of the Vercel runtime
  const { rangeStart: todayStart, rangeEnd } = getBrazilDayRange(new Date())
  const rangeStart = new Date(todayStart.getTime() - (days - 1) * DAY_MS)

  const bookings = await prisma.booking.findMany({
    where: {
      barbershopId: shop.id,
      bookingDate: { gte: rangeStart, lt: rangeEnd },
      status: { not: "CANCELLED" },
    },
    select: {
      bookingDate: true,
      barbershopService: { select: { price: true } },
    },
  })

  const byDate = new Map<string, { bookings: number; revenue: number }>()

  for (let i = 0; i < days; i++) {
    // Noon of each Brazil day, so the key never falls on a day boundary
    const dayNoon = new Date(rangeStart.getTime() + i * DAY_MS + DAY_MS / 2)
    byDate.set(getBrazilDateKey(dayNoon), { bookings: 0, revenue: 0 })
  }

  for (const booking of bookings) {
    const entry = byDate.get(getBrazilDateKey(booking.bookingDate))
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
