"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog"
import ExpenseFormDialog from "./expense-form-dialog"
import { deleteExpense } from "../_actions/delete-expense"
import { EXPENSE_CATEGORY_LABELS } from "../_lib/validations/expense"
import { ExpenseCategory } from "@prisma/client"

const currency = (value: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  )

interface AdminExpense {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  date: Date
}

interface AdminExpensesTableProps {
  expenses: AdminExpense[]
}

const AdminExpensesTable = ({ expenses }: AdminExpensesTableProps) => {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpenId, setDeleteDialogOpenId] = useState<string | null>(
    null,
  )

  const handleDelete = async (expenseId: string) => {
    setIsDeleting(true)

    try {
      await deleteExpense(expenseId)
      toast.success("Despesa removida com sucesso!")
      setDeleteDialogOpenId(null)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao remover despesa.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ExpenseFormDialog
          mode="create"
          renderTrigger={(triggerProps) => (
            <Button className="cursor-pointer gap-2" {...triggerProps}>
              <PlusIcon size={18} />
              Nova despesa
            </Button>
          )}
        />
      </div>

      {expenses.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Nenhuma despesa cadastrada.
        </p>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{expense.description}</p>
                    <Badge variant="secondary">
                      {EXPENSE_CATEGORY_LABELS[expense.category]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {format(expense.date, "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-destructive text-lg font-bold">
                    {currency(expense.amount)}
                  </p>

                  <ExpenseFormDialog
                    mode="edit"
                    expenseId={expense.id}
                    defaultValues={{
                      description: expense.description,
                      amount: expense.amount,
                      category: expense.category,
                      date: expense.date,
                    }}
                    renderTrigger={(triggerProps) => (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="cursor-pointer"
                        {...triggerProps}
                      >
                        <PencilIcon size={16} />
                      </Button>
                    )}
                  />

                  <AlertDialog
                    open={deleteDialogOpenId === expense.id}
                    onOpenChange={(isOpen) =>
                      setDeleteDialogOpenId(isOpen ? expense.id : null)
                    }
                  >
                    <AlertDialogTrigger
                      render={(triggerProps) => (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive cursor-pointer"
                          {...triggerProps}
                        >
                          <Trash2Icon size={16} />
                        </Button>
                      )}
                    />
                    <AlertDialogContent size="default">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover despesa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover &quot;
                          {expense.description}&quot;?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          disabled={isDeleting}
                          onClick={(e) => {
                            e.preventDefault()
                            handleDelete(expense.id)
                          }}
                        >
                          {isDeleting ? "Removendo..." : "Confirmar"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminExpensesTable
