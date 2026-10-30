"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import { removeEmployeeFromShop } from "../_lib/staff-removal"

// Removes the barber from THIS shop only: a barber with bookings or reviews
// is deactivated (history stays), otherwise the Employee row is deleted. The
// EMPLOYEE membership goes away and the global User is kept.
export const deleteEmployee = async (slug: string, employeeId: string) => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, barbershopId: shop.id, isActive: true },
    select: { id: true, userId: true },
  })

  if (!employee) {
    throw new Error("Funcionário não encontrado.")
  }

  await prisma.$transaction(async (tx) => {
    const { count } = await removeEmployeeFromShop(tx, employee, shop.id)

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
  })

  revalidateShop(shop)
}
