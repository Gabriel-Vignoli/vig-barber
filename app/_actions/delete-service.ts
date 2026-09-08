"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"

export const deleteService = async (serviceId: string) => {
  await requireAdmin()

  const bookingCount = await prisma.booking.count({
    where: { barbershopServiceId: serviceId },
  })

  if (bookingCount > 0) {
    throw new Error(
      "Não é possível excluir um serviço com agendamentos associados.",
    )
  }

  await prisma.barbershopService.delete({ where: { id: serviceId } })

  revalidatePath("/admin/services")
  revalidatePath("/")
}
