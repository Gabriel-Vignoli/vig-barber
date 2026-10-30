"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import { expenseFormSchema } from "../_lib/validations/expense"

export const updateExpense = async (
  slug: string,
  expenseId: string,
  input: {
    description: string
    amount: number
    category: string
    date: Date
  },
) => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  const parsed = expenseFormSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const { count } = await prisma.expense.updateMany({
    where: { id: expenseId, barbershopId: shop.id },
    data: parsed.data,
  })

  if (count === 0) {
    throw new Error("Despesa não encontrada.")
  }

  revalidateShop(shop)
}
