"use server"

import { endOfDay, startOfDay } from "date-fns"
import { prisma } from "../_lib/prisma"

interface GetBookingsProps {
  employeeId: string
  date: Date
}

export const getBookings = async ({ date, employeeId }: GetBookingsProps) => {
  return await prisma.booking.findMany({
    where: {
      employeeId,
      bookingDate: {
        lte: endOfDay(date),
        gte: startOfDay(date),
      },
    },
  })
}
