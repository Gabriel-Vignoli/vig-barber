"use server"

import { subDays, startOfDay, endOfDay, format } from "date-fns"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"

export type EmployeesOverviewRange = "7d" | "30d" | "90d"

export interface EmployeesOverviewResult {
  data: Record<string, string | number>[]
  employeeNames: string[]
}

const RANGE_DAYS: Record<EmployeesOverviewRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
}

export const getEmployeesOverview = async (
  range: EmployeesOverviewRange,
): Promise<EmployeesOverviewResult> => {
  await requireAdmin()

  const days = RANGE_DAYS[range]
  const rangeStart = startOfDay(subDays(new Date(), days - 1))
  const rangeEnd = endOfDay(new Date())

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

  for (let i = 0; i < days; i++) {
    const date = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd")
    const emptyRow: Record<string, number> = {}
    employeeNames.forEach((name) => {
      emptyRow[name] = 0
    })
    byDate.set(date, emptyRow)
  }

  for (const booking of bookings) {
    const dateKey = format(booking.bookingDate, "yyyy-MM-dd")
    const employeeName = (booking.employee.user.name ?? "Funcionário").split(
      " ",
    )[0]
    const row = byDate.get(dateKey)
    if (row && employeeNames.includes(employeeName)) {
      row[employeeName] = (row[employeeName] ?? 0) + 1
    }
  }

  const data = Array.from(byDate.entries()).map(([date, values]) => ({
    date,
    ...values,
  }))

  return { data, employeeNames }
}
