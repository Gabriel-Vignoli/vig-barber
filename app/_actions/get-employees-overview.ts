"use server"

import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"

export interface EmployeesOverviewResult {
  data: Record<string, string | number>[]
  employeeNames: string[]
}

export const getEmployeesOverview =
  async (): Promise<EmployeesOverviewResult> => {
    await requireAdmin()

    const now = new Date()
    const rangeStart = startOfMonth(now)
    const rangeEnd = endOfMonth(now)

    const allEmployees = await prisma.employee.findMany({
      where: { isActive: true },
      include: { user: { select: { name: true } } },
    })

    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: { gte: rangeStart, lte: rangeEnd },
        status: { not: "CANCELLED" },
      },
      include: {
        employee: { include: { user: { select: { name: true } } } },
      },
    })

    const employeeNames = allEmployees.map(
      (employee) => (employee.user.name ?? "Funcionário").split(" ")[0],
    )

    if (employeeNames.length === 0) {
      return { data: [], employeeNames: [] }
    }

    const byDate = new Map<string, Record<string, number>>()

    for (const day of eachDayOfInterval({ start: rangeStart, end: rangeEnd })) {
      const key = format(day, "yyyy-MM-dd")
      const emptyRow: Record<string, number> = {}
      employeeNames.forEach((name) => {
        emptyRow[name] = 0
      })
      byDate.set(key, emptyRow)
    }

    for (const booking of bookings) {
      const isConcluded =
        booking.status === "COMPLETED" || booking.bookingDate < now

      if (!isConcluded) continue

      const dateKey = format(booking.bookingDate, "yyyy-MM-dd")
      const employeeName = (booking.employee.user.name ?? "Funcionário").split(
        " ",
      )[0]
      const row = byDate.get(dateKey)

      if (row && employeeName in row) {
        row[employeeName] = (row[employeeName] ?? 0) + 1
      }
    }

    const data = Array.from(byDate.entries()).map(([date, values]) => ({
      date,
      ...values,
    }))

    return { data, employeeNames }
  }
