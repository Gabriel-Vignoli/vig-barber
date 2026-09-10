"use server"

import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"
import {
  getBrazilDayRange,
  getBrazilWeekRange,
  getBrazilMonthRange,
} from "../_lib/timezone"

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

export interface ServiceStat {
  serviceId: string
  serviceName: string
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
  serviceStats: ServiceStat[]
}

export const getDashboardStats = async ({
  period,
  date,
}: GetDashboardStatsParams): Promise<DashboardStats> => {
  await requireAdmin()

  const { rangeStart, rangeEnd } =
    period === "day"
      ? getBrazilDayRange(date)
      : period === "week"
        ? getBrazilWeekRange(date)
        : getBrazilMonthRange(date)

  const bookings = await prisma.booking.findMany({
    where: {
      bookingDate: { gte: rangeStart, lt: rangeEnd },
      status: { not: "CANCELLED" },
    },
    include: {
      employee: { include: { user: { select: { name: true } } } },
      barbershopService: { select: { id: true, name: true, price: true } },
    },
  })

  const now = new Date()
  const statsByEmployee = new Map<string, EmployeeStat>()
  const statsByService = new Map<string, ServiceStat>()

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
    const existingEmployee = statsByEmployee.get(booking.employeeId)

    if (existingEmployee) {
      existingEmployee.bookings += 1
      existingEmployee.revenue += price
    } else {
      statsByEmployee.set(booking.employeeId, {
        employeeId: booking.employeeId,
        employeeName,
        bookings: 1,
        revenue: price,
      })
    }

    const serviceId = booking.barbershopService.id
    const serviceName = booking.barbershopService.name
    const existingService = statsByService.get(serviceId)

    if (existingService) {
      existingService.bookings += 1
      existingService.revenue += price
    } else {
      statsByService.set(serviceId, {
        serviceId,
        serviceName,
        bookings: 1,
        revenue: price,
      })
    }
  }

  const employeeStats = Array.from(statsByEmployee.values()).sort(
    (a, b) => b.revenue - a.revenue,
  )

  const serviceStats = Array.from(statsByService.values()).sort(
    (a, b) => b.bookings - a.bookings,
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
    serviceStats,
  }
}
