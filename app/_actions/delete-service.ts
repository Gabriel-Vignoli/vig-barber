"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"

export const deleteService = async (slug: string, serviceId: string) => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  const service = await prisma.barbershopService.findFirst({
    where: { id: serviceId, barbershopId: shop.id },
    select: { id: true },
  })

  if (!service) {
    throw new Error("Serviço não encontrado.")
  }

  const bookingCount = await prisma.booking.count({
    where: { barbershopServiceId: service.id, barbershopId: shop.id },
  })

  if (bookingCount > 0) {
    throw new Error(
      "Não é possível excluir um serviço com agendamentos associados.",
    )
  }

  const { count } = await prisma.barbershopService.deleteMany({
    where: { id: service.id, barbershopId: shop.id },
  })

  if (count === 0) {
    throw new Error("Serviço não encontrado.")
  }

  revalidateShop(shop)
}
