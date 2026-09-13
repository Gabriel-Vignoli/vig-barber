"use server"

import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"
import { getBrazilMonthRange } from "../_lib/timezone"

export interface NetProfitResult {
  concludedRevenue: number
  totalExpenses: number
  netProfit: number
}

export const getNetProfit = async (): Promise<NetProfitResult> => {
  await requireAdmin()

  const now = new Date()
  const { rangeStart, rangeEnd } = getBrazilMonthRange(now)

  const bookings = await prisma.booking.findMany({
    where: {
      bookingDate: { gte: rangeStart, lt: rangeEnd },
      status: { not: "CANCELLED" },
    },
    include: { barbershopService: { select: { price: true } } },
  })

  let concludedRevenue = 0

  for (const booking of bookings) {
    const isConcluded =
      booking.status === "COMPLETED" || booking.bookingDate < now

    if (isConcluded) {
      concludedRevenue += Number(booking.barbershopService.price)
    }
  }

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: rangeStart, lt: rangeEnd } },
  })

  const totalExpenses = expenses.reduce(
    (acc, expense) => acc + Number(expense.amount),
    0,
  )

  return {
    concludedRevenue,
    totalExpenses,
    netProfit: concludedRevenue - totalExpenses,
  }
}
