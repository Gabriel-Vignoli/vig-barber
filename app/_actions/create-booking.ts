"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "../_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

interface CreateBookingParams {
  barbershopServiceId: string
  employeeId: string
  bookingDate: Date
}

export const createBooking = async ({
  barbershopServiceId,
  employeeId,
  bookingDate,
}: CreateBookingParams) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionUser = session.user as any

  if (sessionUser.role === "ADMIN") {
    throw new Error("Administradores não podem realizar agendamentos.")
  }

  await prisma.booking.create({
    data: {
      barbershopServiceId,
      employeeId,
      bookingDate,
      userId: sessionUser.id,
    },
  })
  revalidatePath("/barbershops/[id]")
  revalidatePath("/employees/[id]")
  revalidatePath("/")
}
