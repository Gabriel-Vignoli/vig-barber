"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"

export const deleteExpense = async (expenseId: string) => {
  await requireAdmin()

  await prisma.expense.delete({ where: { id: expenseId } })

  revalidatePath("/admin/expenses")
  revalidatePath("/admin")
}
