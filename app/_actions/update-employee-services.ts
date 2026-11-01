"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import { employeeServiceIdsSchema } from "../_lib/validations/employee"
import { action, ActionError } from "../_lib/action-result"

export const updateEmployeeServices = action(
  async (slug: string, employeeId: string, serviceIds: string[]) => {
    const { shop } = await assertShopRole(slug, ["ADMIN"])

    const parsed = employeeServiceIdsSchema.safeParse(serviceIds)

    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0].message)
    }

    // A removed barber (kept inactive for their history) is not editable
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, barbershopId: shop.id, isActive: true },
      select: { id: true },
    })

    if (!employee) {
      throw new ActionError("Funcionário não encontrado.")
    }

    // Every service must belong to this shop
    const uniqueServiceIds = [...new Set(parsed.data)]
    const shopServiceCount = await prisma.barbershopService.count({
      where: { id: { in: uniqueServiceIds }, barbershopId: shop.id },
    })

    if (shopServiceCount !== uniqueServiceIds.length) {
      throw new ActionError("Serviço não encontrado.")
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
  },
)
