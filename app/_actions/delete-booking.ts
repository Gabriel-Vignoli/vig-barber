"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "../_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { revalidateShop } from "../_lib/revalidate"

export const deleteBooking = async (bookingId: string) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionUser = session.user as any

  // Clients can only cancel their own bookings
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId: sessionUser.id },
    select: { id: true, barbershop: { select: { id: true, slug: true } } },
  })

  if (!booking) {
    throw new Error("Reserva não encontrada.")
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  })

  revalidateShop(booking.barbershop)
  revalidatePath("/bookings")
  revalidatePath("/")
}
