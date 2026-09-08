"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"

export const updateEmployeeServices = async (
  employeeId: string,
  serviceIds: string[],
) => {
  await requireAdmin()

  await prisma.$transaction([
    prisma.employeeService.deleteMany({ where: { employeeId } }),
    prisma.employeeService.createMany({
      data: serviceIds.map((serviceId) => ({ employeeId, serviceId })),
    }),
  ])

  revalidatePath("/admin/employees")
  revalidatePath("/")
}
