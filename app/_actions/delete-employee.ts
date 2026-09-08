"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"

export const deleteEmployee = async (employeeId: string) => {
  await requireAdmin()

  const bookingCount = await prisma.booking.count({ where: { employeeId } })

  if (bookingCount > 0) {
    throw new Error(
      "Não é possível excluir um funcionário com agendamentos associados.",
    )
  }

  const reviewCount = await prisma.review.count({ where: { employeeId } })

  if (reviewCount > 0) {
    throw new Error(
      "Não é possível excluir um funcionário com avaliações associadas.",
    )
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  })

  if (!employee) {
    throw new Error("Funcionário não encontrado.")
  }

  // Deleting the User cascades to Employee (and EmployeeService/EmployeeSchedule)
  await prisma.user.delete({ where: { id: employee.userId } })

  revalidatePath("/admin/employees")
  revalidatePath("/")
}
