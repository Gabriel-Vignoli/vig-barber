"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"
import { expenseFormSchema } from "../_lib/validations/expense"

export const updateExpense = async (
  expenseId: string,
  input: {
    description: string
    amount: number
    category: string
    date: Date
  },
) => {
  await requireAdmin()

  const parsed = expenseFormSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  await prisma.expense.update({
    where: { id: expenseId },
    data: parsed.data,
  })

  revalidatePath("/admin/expenses")
  revalidatePath("/admin")
}
