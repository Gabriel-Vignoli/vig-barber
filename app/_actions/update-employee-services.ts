"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"

export const updateEmployeeServices = async (
  slug: string,
  employeeId: string,
  serviceIds: string[],
) => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, barbershopId: shop.id },
    select: { id: true },
  })

  if (!employee) {
    throw new Error("Funcionário não encontrado.")
  }

  // Every service must belong to this shop
  const uniqueServiceIds = [...new Set(serviceIds)]
  const shopServiceCount = await prisma.barbershopService.count({
    where: { id: { in: uniqueServiceIds }, barbershopId: shop.id },
  })

  if (shopServiceCount !== uniqueServiceIds.length) {
    throw new Error("Serviço não encontrado.")
  }

  await prisma.$transaction([
    prisma.employeeService.deleteMany({ where: { employeeId: employee.id } }),
    prisma.employeeService.createMany({
      data: uniqueServiceIds.map((serviceId) => ({
        employeeId: employee.id,
        serviceId,
      })),
    }),
  ])

  revalidateShop(shop)
}
