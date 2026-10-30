"use server"

import { assertShopRole } from "../_lib/tenant"
import { prisma } from "../_lib/prisma"
import { getBrazilMonthRange } from "../_lib/timezone"
import { EXPENSE_CATEGORY_LABELS } from "../_lib/validations/expense"

export interface CategoryExpense {
  category: string
  label: string
  total: number
}

export interface ExpensesOverviewResult {
  totalExpenses: number
  categoryBreakdown: CategoryExpense[]
}

export const getExpensesOverview = async (
  slug: string,
): Promise<ExpensesOverviewResult> => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  const { rangeStart, rangeEnd } = getBrazilMonthRange(new Date())

  const expenses = await prisma.expense.findMany({
    where: { barbershopId: shop.id, date: { gte: rangeStart, lt: rangeEnd } },
  })

  const byCategory = new Map<string, number>()
  let totalExpenses = 0

  for (const expense of expenses) {
    const amount = Number(expense.amount)
    totalExpenses += amount
    byCategory.set(
      expense.category,
      (byCategory.get(expense.category) ?? 0) + amount,
    )
  }

  const categoryBreakdown = Array.from(byCategory.entries())
    .map(([category, total]) => ({
      category,
      label:
        EXPENSE_CATEGORY_LABELS[
          category as keyof typeof EXPENSE_CATEGORY_LABELS
        ],
      total,
    }))
    .sort((a, b) => b.total - a.total)

  return { totalExpenses, categoryBreakdown }
}
