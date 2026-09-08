"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { prisma } from "../_lib/prisma"

interface ReplaceBookingParams {
  oldBookingId: string
  barbershopServiceId: string
  employeeId: string
  bookingDate: Date
}

export const replaceBooking = async ({
  oldBookingId,
  barbershopServiceId,
  employeeId,
  bookingDate,
}: ReplaceBookingParams) => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error("Usuário não autenticado")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id

  const oldBooking = await prisma.booking.findUnique({
    where: { id: oldBookingId },
  })

  if (!oldBooking || oldBooking.userId !== userId) {
    throw new Error("Reserva original não encontrada.")
  }

  await prisma.$transaction([
    prisma.booking.delete({ where: { id: oldBookingId } }),
    prisma.booking.create({
      data: {
        userId,
        barbershopServiceId,
        employeeId,
        bookingDate,
      },
    }),
  ])

  revalidatePath("/bookings")
  revalidatePath("/")
}
