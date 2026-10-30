import { prisma } from "../_lib/prisma"

const PAGE_SIZE = 10

export const getAdminExpenses = async (shopId: string, page: number = 1) => {
  const where = { barbershopId: shopId }

  const totalCount = await prisma.expense.count({ where })
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  const serializedExpenses = expenses.map((expense) => ({
    ...expense,
    amount: Number(expense.amount),
  }))

  return { expenses: serializedExpenses, totalCount, totalPages, currentPage }
}
