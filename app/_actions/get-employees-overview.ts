"use server"

import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"
import {
  getBrazilDateKey,
  getBrazilMonthRange,
  getDaysInBrazilMonth,
} from "../_lib/timezone"

export interface EmployeesOverviewResult {
  data: Record<string, string | number>[]
  employeeNames: string[]
}

export const getEmployeesOverview =
  async (): Promise<EmployeesOverviewResult> => {
    await requireAdmin()

    const now = new Date()
    const { rangeStart, rangeEnd, year, month } = getBrazilMonthRange(now)

    const allEmployees = await prisma.employee.findMany({
      where: { isActive: true },
      include: { user: { select: { name: true } } },
    })

    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: { gte: rangeStart, lt: rangeEnd },
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

    const daysInMonth = getDaysInBrazilMonth(year, month)
    const byDate = new Map<string, Record<string, number>>()

    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
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

      const dateKey = getBrazilDateKey(booking.bookingDate)
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
