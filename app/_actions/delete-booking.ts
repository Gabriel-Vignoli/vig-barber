"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "../_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

export const deleteBooking = async (bookingId: string) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionUser = session.user as any

  await prisma.booking.updateMany({
    where: { id: bookingId, userId: sessionUser.id },
    data: { status: "CANCELLED" },
  })

  revalidatePath("/bookings")
  revalidatePath("/")
}
