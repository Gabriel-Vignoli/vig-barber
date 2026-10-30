"use server"

import { assertShopRole } from "../_lib/tenant"
import { prisma } from "../_lib/prisma"
import { getBrazilMonthRange } from "../_lib/timezone"

export interface NetProfitResult {
  concludedRevenue: number
  totalExpenses: number
  netProfit: number
}

export const getNetProfit = async (slug: string): Promise<NetProfitResult> => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  const now = new Date()
  const { rangeStart, rangeEnd } = getBrazilMonthRange(now)

  const bookings = await prisma.booking.findMany({
    where: {
      barbershopId: shop.id,
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
    where: { barbershopId: shop.id, date: { gte: rangeStart, lt: rangeEnd } },
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
