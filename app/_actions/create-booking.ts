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

const ROLES_BLOCKED_FROM_BOOKING = ["ADMIN", "ATENDENTE"]

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

  if (ROLES_BLOCKED_FROM_BOOKING.includes(sessionUser.role)) {
    throw new Error(
      "Administradores e atendentes não podem realizar agendamentos.",
    )
  }

  const service = await prisma.barbershopService.findUnique({
    where: { id: barbershopServiceId },
    select: { barbershopId: true },
  })
  if (!service) {
    throw new Error("Serviço não encontrado.")
  }

  await prisma.booking.create({
    data: {
      barbershopId: service.barbershopId,
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
