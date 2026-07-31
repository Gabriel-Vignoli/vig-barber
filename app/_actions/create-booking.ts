"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "../_lib/prisma"

interface CreateBookingParams {
  userId: string
  barbershopServiceId: string
  bookingDate: Date
}

export const createBooking = async ({
  barbershopServiceId,
  userId,
  bookingDate,
}: CreateBookingParams) => {
  await prisma.booking.create({
    data: {
      barbershopServiceId,
      userId,
      bookingDate,
    },
  })
  revalidatePath("/barbershops/[id]")
}
