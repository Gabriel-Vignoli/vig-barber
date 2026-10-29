"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"
import { expenseFormSchema } from "../_lib/validations/expense"

export const createExpense = async (input: {
  description: string
  amount: number
  category: string
  date: Date
}) => {
  await requireAdmin()

  const parsed = expenseFormSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  // single-shop for now; scoped to the tenant in Phase 4a
  const barbershop = await prisma.barbershop.findFirst({
    select: { id: true },
  })
  if (!barbershop) {
    throw new Error("Barbearia não encontrada.")
  }

  await prisma.expense.create({
    data: { ...parsed.data, barbershopId: barbershop.id },
  })

  revalidatePath("/admin/expenses")
  revalidatePath("/admin")
}
