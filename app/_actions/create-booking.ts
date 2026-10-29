"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "../_lib/prisma"
import { prepareCustomerBooking } from "../_lib/customer-booking"
import { revalidateShop } from "../_lib/revalidate"

interface CreateBookingParams {
  barbershopServiceId: string
  employeeId: string
  bookingDate: Date
}

export const createBooking = async (
  slug: string,
  { barbershopServiceId, employeeId, bookingDate }: CreateBookingParams,
) => {
  const { shop, userId } = await prepareCustomerBooking(slug, {
    barbershopServiceId,
    employeeId,
    bookingDate,
  })

  await prisma.booking.create({
    data: {
      barbershopId: shop.id,
      barbershopServiceId,
      employeeId,
      bookingDate,
      userId,
    },
  })

  revalidateShop(shop)
  revalidatePath("/bookings")
}
