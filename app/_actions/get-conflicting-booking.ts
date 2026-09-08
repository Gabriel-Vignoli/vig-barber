"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { prisma } from "../_lib/prisma"

export const getConflictingBooking = async (bookingDate: Date) => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error("Usuário não autenticado")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id

  const conflict = await prisma.booking.findFirst({
    where: {
      userId,
      bookingDate,
      status: { not: "CANCELLED" },
    },
    include: {
      employee: { include: { user: { select: { name: true } } } },
      barbershopService: { select: { name: true } },
    },
  })

  return conflict
}
