import { z } from "zod"
import { ExpenseCategory } from "@prisma/client"

export const expenseFormSchema = z.object({
  description: z
    .string()
    .min(2, "A descrição deve ter pelo menos 2 caracteres."),
  amount: z.coerce.number().positive("O valor deve ser maior que zero."),
  category: z.enum(ExpenseCategory, {
    message: "Selecione uma categoria.",
  }),
  date: z.coerce.date(),
})

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ALUGUEL: "Aluguel",
  FUNCIONARIOS: "Funcionários",
  PRODUTOS: "Produtos",
  EQUIPAMENTOS: "Equipamentos",
  MARKETING: "Marketing",
  CONTAS: "Contas",
  MANUTENCAO: "Manutenção",
  OUTROS: "Outros",
}
