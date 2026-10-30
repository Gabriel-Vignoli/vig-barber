"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import {
  removeEmployeeFromShop,
  syncLegacyStaffRole,
} from "../_lib/staff-removal"

// Removes the ATENDENTE membership in THIS shop. An Employee row the user
// still has here (legacy data) is removed the same way as a barber, since
// without a membership they are no longer staff of this shop. The global
// User is kept.
export const deleteAtendente = async (slug: string, userId: string) => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  await prisma.$transaction(async (tx) => {
    // Only an ATENDENTE membership of this shop can be removed here
    const { count } = await tx.membership.deleteMany({
      where: { userId, barbershopId: shop.id, role: "ATENDENTE" },
    })

    if (count === 0) {
      throw new Error("Atendente não encontrado.")
    }

    const employee = await tx.employee.findFirst({
      where: { userId, barbershopId: shop.id, isActive: true },
      select: { id: true },
    })

    if (employee) {
      await removeEmployeeFromShop(tx, employee, shop.id)
    }

    await syncLegacyStaffRole(tx, userId)
  })

  revalidateShop(shop)
}
