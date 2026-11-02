"use server"

import { endOfDay, startOfDay } from "date-fns"
import { prisma } from "../_lib/prisma"
import { getBookableShopOrThrow } from "../_lib/customer-booking"

interface GetBookingsProps {
  employeeId: string
  date: Date
}

// Public: returns only what getTimeList needs to block taken slots
export const getBookings = async (
  slug: string,
  { date, employeeId }: GetBookingsProps,
) => {
  const shop = await getBookableShopOrThrow(slug)

  return prisma.booking.findMany({
    where: {
      barbershopId: shop.id,
      employeeId,
      status: { not: "CANCELLED" },
      bookingDate: {
        lte: endOfDay(date),
        gte: startOfDay(date),
      },
    },
    select: {
      bookingDate: true,
      barbershopService: { select: { durationInMinutes: true } },
    },
  })
}
