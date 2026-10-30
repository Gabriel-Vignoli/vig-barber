"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"

// Removes the ATENDENTE membership in THIS shop. The global User is kept,
// since they may be staff elsewhere or book as a client.
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

    // TODO(Phase 4c): drop once User.role is gone. Without a staff role
    // anywhere, the global ATENDENTE role would still open /admin/atendente.
    const remainingStaff = await tx.membership.count({
      where: { userId, role: { in: ["ADMIN", "ATENDENTE"] } },
    })

    if (remainingStaff === 0) {
      await tx.user.updateMany({
        where: { id: userId, role: "ATENDENTE" },
        data: { role: "CLIENT" },
      })
    }
  })

  revalidateShop(shop)
}
