"use server"

import { revalidatePath } from "next/cache"
import { requireAtendente } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"

interface CreateWalkInBookingParams {
  employeeId: string
  barbershopServiceId: string
  bookingDate: Date
  clientName: string
  clientPhone?: string
}

export const createWalkInBooking = async ({
  employeeId,
  barbershopServiceId,
  bookingDate,
  clientName,
  clientPhone,
}: CreateWalkInBookingParams) => {
  await requireAtendente()

  if (!clientName || clientName.trim().length < 2) {
    throw new Error("O nome do cliente deve ter pelo menos 2 caracteres.")
  }

  const walkInUser = await prisma.user.create({
    data: {
      name: clientName.trim(),
      phone: clientPhone?.trim() || null,
      role: "CLIENT",
    },
  })

  await prisma.booking.create({
    data: {
      barbershopServiceId,
      employeeId,
      bookingDate,
      userId: walkInUser.id,
    },
  })

  revalidatePath("/admin/atendente")
  revalidatePath("/admin/bookings")
}
