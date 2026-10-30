"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"

interface CreateWalkInBookingParams {
  employeeId: string
  barbershopServiceId: string
  bookingDate: Date
  clientName: string
  clientPhone?: string
}

// Front-desk booking for a client without an account. The shop comes from
// the slug and the staff membership, never from the client.
export const createWalkInBooking = async (
  slug: string,
  {
    employeeId,
    barbershopServiceId,
    bookingDate,
    clientName,
    clientPhone,
  }: CreateWalkInBookingParams,
) => {
  const { shop } = await assertShopRole(slug, ["ATENDENTE", "ADMIN"])

  if (!clientName || clientName.trim().length < 2) {
    throw new Error("O nome do cliente deve ter pelo menos 2 caracteres.")
  }

  if (!(bookingDate instanceof Date) || Number.isNaN(bookingDate.getTime())) {
    throw new Error("Data inválida.")
  }

  // One query: the service and the active employee belong to this shop and
  // the employee offers the service
  const link = await prisma.employeeService.findFirst({
    where: {
      serviceId: barbershopServiceId,
      employeeId,
      service: { barbershopId: shop.id },
      employee: { barbershopId: shop.id, isActive: true },
    },
    select: { id: true },
  })

  if (!link) {
    throw new Error("Serviço ou profissional indisponível nesta barbearia.")
  }

  await prisma.$transaction(async (tx) => {
    const walkInUser = await tx.user.create({
      data: {
        name: clientName.trim(),
        phone: clientPhone?.trim() || null,
        role: "CLIENT",
      },
      select: { id: true },
    })

    await tx.booking.create({
      data: {
        barbershopId: shop.id,
        barbershopServiceId,
        employeeId,
        bookingDate,
        userId: walkInUser.id,
      },
    })
  })

  revalidateShop(shop)
}
