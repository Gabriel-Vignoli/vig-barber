"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"

export const deleteExpense = async (slug: string, expenseId: string) => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  const { count } = await prisma.expense.deleteMany({
    where: { id: expenseId, barbershopId: shop.id },
  })

  if (count === 0) {
    throw new Error("Despesa não encontrada.")
  }

  revalidateShop(shop)
}
