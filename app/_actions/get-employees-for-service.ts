"use server"

import { prisma } from "../_lib/prisma"

export const getEmployeesForService = async (serviceId: string) => {
  const employeeServices = await prisma.employeeService.findMany({
    where: {
      serviceId,
      employee: { isActive: true },
    },
    include: {
      employee: {
        include: {
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
