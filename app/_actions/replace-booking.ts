"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "../_lib/prisma"
import { prepareCustomerBooking } from "../_lib/customer-booking"
import { revalidateShop } from "../_lib/revalidate"

interface ReplaceBookingParams {
  oldBookingId: string
  barbershopServiceId: string
  employeeId: string
  bookingDate: Date
}

// The old booking may belong to another shop: conflicts are per user
export const replaceBooking = async (
  slug: string,
  {
    oldBookingId,
    barbershopServiceId,
    employeeId,
    bookingDate,
  }: ReplaceBookingParams,
) => {
  const { shop, userId } = await prepareCustomerBooking(slug, {
    barbershopServiceId,
    employeeId,
    bookingDate,
  })

  const oldBooking = await prisma.booking.findFirst({
    where: { id: oldBookingId, userId, status: { not: "CANCELLED" } },
    select: { id: true, barbershop: { select: { id: true, slug: true } } },
  })

  if (!oldBooking) {
    throw new Error("Reserva original não encontrada.")
  }

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: oldBooking.id },
      data: { status: "CANCELLED" },
    }),
    prisma.booking.create({
      data: {
        barbershopId: shop.id,
        userId,
        barbershopServiceId,
        employeeId,
        bookingDate,
      },
    }),
  ])

  revalidateShop(shop)
  if (oldBooking.barbershop.id !== shop.id) {
    revalidateShop(oldBooking.barbershop)
  }
  revalidatePath("/bookings")
}
