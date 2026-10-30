"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import { expenseFormSchema } from "../_lib/validations/expense"

export const createExpense = async (
  slug: string,
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

  await prisma.expense.create({
    data: { ...parsed.data, barbershopId: shop.id },
  })

  revalidateShop(shop)
}
