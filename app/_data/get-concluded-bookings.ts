"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { prisma } from "../_lib/prisma"

export const getConcludedBookings = async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return []
  }

  const bookings = await prisma.booking.findMany({
    where: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId: (session.user as any).id,
      bookingDate: {
        lt: new Date(),
      },
    },
    include: {
      barbershopService: {
        include: {
          barbershop: true,
        },
      },
      employee: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      bookingDate: "desc",
    },
  })

  // Prisma's Decimal fields can't be passed from Server to Client Components,
  // so we convert price to a plain number before rendering <BookingItem>.
  const serializedBookings = bookings.map((booking) => ({
    ...booking,
    barbershopService: {
      ...booking.barbershopService,
      price: Number(booking.barbershopService.price),
    },
  }))

  return serializedBookings
}
