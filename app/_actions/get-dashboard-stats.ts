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

export type DashboardPeriod = "day" | "week" | "month"

interface GetDashboardStatsParams {
  period: DashboardPeriod
  date: Date
}

export interface EmployeeStat {
  employeeId: string
  employeeName: string
  bookings: number
  revenue: number
}

export interface CountBreakdown {
  concluded: number
  upcoming: number
  total: number
}

export interface RevenueBreakdown {
  concluded: number
  upcoming: number
  total: number
}

export interface DashboardStats {
  bookingsBreakdown: CountBreakdown
  revenueBreakdown: RevenueBreakdown
  rangeStart: Date
  rangeEnd: Date
  employeeStats: EmployeeStat[]
}

export const getDashboardStats = async ({
  period,
  date,
}: GetDashboardStatsParams): Promise<DashboardStats> => {
  await requireAdmin()

  let rangeStart: Date
  let rangeEnd: Date

  if (period === "day") {
    rangeStart = startOfDay(date)
    rangeEnd = endOfDay(date)
  } else if (period === "week") {
    rangeStart = startOfWeek(date, { weekStartsOn: 0 })
    rangeEnd = endOfWeek(date, { weekStartsOn: 0 })
  } else {
    rangeStart = startOfMonth(date)
    rangeEnd = endOfMonth(date)
  }

  const bookings = await prisma.booking.findMany({
    where: {
      bookingDate: { gte: rangeStart, lte: rangeEnd },
      status: { not: "CANCELLED" },
    },
    include: {
      employee: { include: { user: { select: { name: true } } } },
      barbershopService: { select: { price: true } },
    },
  })

  const now = new Date()
  const statsByEmployee = new Map<string, EmployeeStat>()

  let concludedBookings = 0
  let upcomingBookings = 0
  let concludedRevenue = 0
  let upcomingRevenue = 0

  for (const booking of bookings) {
    const price = Number(booking.barbershopService.price)
    const isConcluded =
      booking.status === "COMPLETED" || booking.bookingDate < now

    if (isConcluded) {
      concludedBookings += 1
      concludedRevenue += price
    } else {
      upcomingBookings += 1
      upcomingRevenue += price
    }

    const employeeName = booking.employee.user.name ?? "Funcionário"
    const existing = statsByEmployee.get(booking.employeeId)

    if (existing) {
      existing.bookings += 1
      existing.revenue += price
    } else {
      statsByEmployee.set(booking.employeeId, {
        employeeId: booking.employeeId,
        employeeName,
        bookings: 1,
        revenue: price,
      })
    }
  }

  const employeeStats = Array.from(statsByEmployee.values()).sort(
    (a, b) => b.revenue - a.revenue,
  )

  return {
    bookingsBreakdown: {
      concluded: concludedBookings,
      upcoming: upcomingBookings,
      total: concludedBookings + upcomingBookings,
    },
    revenueBreakdown: {
      concluded: concludedRevenue,
      upcoming: upcomingRevenue,
      total: concludedRevenue + upcomingRevenue,
    },
    rangeStart,
    rangeEnd,
    employeeStats,
  }
}
