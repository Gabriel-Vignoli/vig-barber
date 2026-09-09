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

export interface DashboardStats {
  totalBookings: number
  totalRevenue: number
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

  const statsByEmployee = new Map<string, EmployeeStat>()

  let totalBookings = 0
  let totalRevenue = 0

  for (const booking of bookings) {
    const price = Number(booking.barbershopService.price)
    totalBookings += 1
    totalRevenue += price

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

  return { totalBookings, totalRevenue, rangeStart, rangeEnd, employeeStats }
}
