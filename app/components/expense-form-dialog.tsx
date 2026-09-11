"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { createExpense } from "../_actions/create-expense"
import { updateExpense } from "../_actions/update-expense"
import {
  expenseFormSchema,
  ExpenseFormValues,
  EXPENSE_CATEGORY_LABELS,
} from "../_lib/validations/expense"

interface ExpenseFormDialogProps {
  mode: "create" | "edit"
  expenseId?: string
  defaultValues?: ExpenseFormValues
  renderTrigger: DialogPrimitive.Trigger.Props["render"]
}

const EMPTY_VALUES: ExpenseFormValues = {
  description: "",
  amount: 0,
  category: "OUTROS",
  date: new Date(),
}

const ExpenseFormDialog = ({
  mode,
  expenseId,
  defaultValues,
  renderTrigger,
}: ExpenseFormDialogProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState, reset, watch, setValue } =
    useForm<ExpenseFormValues>({
      resolver: zodResolver(expenseFormSchema) as never,
      defaultValues: defaultValues ?? EMPTY_VALUES,
    })

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) reset(defaultValues ?? EMPTY_VALUES)
  }

  const onSubmit = async (values: ExpenseFormValues) => {
    setIsSubmitting(true)

    try {
      if (mode === "create") {
        await createExpense(values)
        toast.success("Despesa criada com sucesso!")
      } else {
        if (!expenseId) return
        await updateExpense(expenseId, values)
        toast.success("Despesa atualizada com sucesso!")
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar despesa.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const dateValue = watch("date")
  const dateInputValue =
    dateValue instanceof Date
      ? dateValue.toISOString().split("T")[0]
      : String(dateValue).split("T")[0]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={renderTrigger} />
      <DialogContent className="w-[90%] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nova despesa" : "Editar despesa"}
          </DialogTitle>
          <DialogDescription>
            Registre uma despesa da barbearia.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 text-left"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-1">
            <Label htmlFor="expense-description">Descrição</Label>
            <Input
              id="expense-description"
              type="text"
              {...register("description")}
            />
            {formState.errors.description && (
              <p className="text-destructive text-xs">
                {formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="expense-amount">Valor (R$)</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0"
                {...register("amount")}
              />
              {formState.errors.amount && (
                <p className="text-destructive text-xs">
                  {formState.errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="expense-date">Data</Label>
              <Input
                id="expense-date"
                type="date"
                value={dateInputValue}
                onChange={(e) =>
                  setValue("date", new Date(`${e.target.value}T12:00:00`))
                }
              />
              {formState.errors.date && (
                <p className="text-destructive text-xs">
                  {formState.errors.date.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="expense-category">Categoria</Label>
            <Select
              value={watch("category")}
              onValueChange={(value) =>
                setValue("category", value as ExpenseFormValues["category"])
              }
            >
              <SelectTrigger id="expense-category" className="w-full">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            {formState.errors.category && (
              <p className="text-destructive text-xs">
                {formState.errors.category.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer py-5"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : mode === "create" ? (
              "Criar despesa"
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ExpenseFormDialog
