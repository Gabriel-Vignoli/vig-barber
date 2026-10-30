"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"

// Removes the employee from THIS shop only. The global User is kept, since
// they may work in other shops or book as a client.
export const deleteEmployee = async (slug: string, employeeId: string) => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, barbershopId: shop.id },
    select: { id: true, userId: true },
  })

  if (!employee) {
    throw new Error("Funcionário não encontrado.")
  }

  const bookingCount = await prisma.booking.count({
    where: { employeeId: employee.id, barbershopId: shop.id },
  })

  if (bookingCount > 0) {
    throw new Error(
      "Não é possível excluir um funcionário com agendamentos associados.",
    )
  }

  const reviewCount = await prisma.review.count({
    where: { employeeId: employee.id, barbershopId: shop.id },
  })

  if (reviewCount > 0) {
    throw new Error(
      "Não é possível excluir um funcionário com avaliações associadas.",
    )
  }

  await prisma.$transaction(async (tx) => {
    // Cascades to EmployeeService and EmployeeSchedule
    const { count } = await tx.employee.deleteMany({
      where: { id: employee.id, barbershopId: shop.id },
    })

    if (count === 0) {
      throw new Error("Funcionário não encontrado.")
    }

    // An ADMIN who also cuts hair keeps their ADMIN membership
    await tx.membership.deleteMany({
      where: {
        userId: employee.userId,
        barbershopId: shop.id,
        role: "EMPLOYEE",
      },
    })

    // TODO(Phase 4c): drop once User.role is gone. Without an Employee row
    // anywhere, the global EMPLOYEE role would lock them out of booking.
    const remainingEmployees = await tx.employee.count({
      where: { userId: employee.userId },
    })

    if (remainingEmployees === 0) {
      await tx.user.updateMany({
        where: { id: employee.userId, role: "EMPLOYEE" },
        data: { role: "CLIENT" },
      })
    }
  })

  revalidateShop(shop)
}
