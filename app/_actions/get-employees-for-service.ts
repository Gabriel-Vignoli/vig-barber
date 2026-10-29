"use server"

import { prisma } from "../_lib/prisma"
import { getActiveShopOrThrow } from "../_lib/tenant"

// Public: active employees of this shop that offer a service of this shop
export const getEmployeesForService = async (
  slug: string,
  serviceId: string,
) => {
  const shop = await getActiveShopOrThrow(slug)

  const employeeServices = await prisma.employeeService.findMany({
    where: {
      serviceId,
      service: { barbershopId: shop.id },
      employee: { barbershopId: shop.id, isActive: true },
    },
    select: {
      employee: {
        select: {
          id: true,
          imageUrl: true,
          user: { select: { name: true, image: true } },
        },
      },
    },
  })

  return employeeServices.map(({ employee }) => ({
    id: employee.id,
    name: employee.user.name ?? "Funcionário",
    imageUrl:
      employee.imageUrl ?? employee.user.image ?? "/avatar-placeholder.png",
  }))
}
