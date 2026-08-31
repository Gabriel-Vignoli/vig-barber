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
  const user = await getServerSession(authOptions)
  if (!user) {
    throw new Error("Usuário não autenticado")
  }
  await prisma.booking.create({
    data: {
      barbershopServiceId,
      employeeId,
      bookingDate,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId: (user.user as any).id,
    },
  })
  revalidatePath("/barbershops/[id]")
  revalidatePath("/employees/[id]")
  revalidatePath("/")
}
