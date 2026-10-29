"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { prisma } from "../_lib/prisma"
import { clientBookingSelect } from "./client-booking-select"

// The signed-in user's upcoming bookings. Pass barbershopId to limit them to
// one shop (shop home); omit it for the global /bookings page.
export const getConfirmedBookings = async (barbershopId?: string) => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return []
  }

  const bookings = await prisma.booking.findMany({
    where: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId: (session.user as any).id,
      ...(barbershopId ? { barbershopId } : {}),
      status: { not: "CANCELLED" },
      bookingDate: {
        gte: new Date(),
      },
    },
    select: clientBookingSelect,
    orderBy: {
      bookingDate: "asc",
    },
  })

  // Prisma's Decimal fields can't be passed from Server to Client Components,
  // so we convert price to a plain number before rendering <BookingItem>.
  return bookings.map((booking) => ({
    ...booking,
    barbershopService: {
      ...booking.barbershopService,
      price: Number(booking.barbershopService.price),
    },
  }))
}
