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

const ROLES_BLOCKED_FROM_BOOKING = ["ADMIN", "ATENDENTE"]

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
  const sessionUser = session.user as any
  const userId = sessionUser.id

  if (ROLES_BLOCKED_FROM_BOOKING.includes(sessionUser.role)) {
    throw new Error(
      "Administradores e atendentes não podem realizar agendamentos.",
    )
  }

  const oldBooking = await prisma.booking.findUnique({
    where: { id: oldBookingId },
  })

  if (
    !oldBooking ||
    oldBooking.userId !== userId ||
    oldBooking.status === "CANCELLED"
  ) {
    throw new Error("Reserva original não encontrada.")
  }

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: oldBookingId },
      data: { status: "CANCELLED" },
    }),
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
