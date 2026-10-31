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
    select: {
      id: true,
      status: true,
      bookingDate: true,
      barbershop: { select: { id: true, slug: true } },
    },
  })

  if (!booking) {
    throw new Error("Reserva não encontrada.")
  }

  // Past, completed or already cancelled bookings stay as they are, so a
  // client cannot remove revenue from the shop's stats
  if (booking.status !== "PENDING" || booking.bookingDate <= new Date()) {
    throw new Error("Esta reserva não pode mais ser cancelada.")
  }

  // Same filters in the write, so a status change in between is not overwritten
  const { count } = await prisma.booking.updateMany({
    where: {
      id: booking.id,
      userId: sessionUser.id,
      status: "PENDING",
      bookingDate: { gt: new Date() },
    },
    data: { status: "CANCELLED" },
  })

  if (count === 0) {
    throw new Error("Esta reserva não pode mais ser cancelada.")
  }

  revalidateShop(booking.barbershop)
  revalidatePath("/bookings")
  revalidatePath("/")
}
