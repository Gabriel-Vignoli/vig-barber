"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2Icon, PencilIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { updateEmployee } from "../_actions/update-employee"
import {
  updateEmployeeSchema,
  UpdateEmployeeFormValues,
} from "../_lib/validations/employee"

interface EmployeeEditDialogProps {
  employeeId: string
  employeeName: string
  defaultValues: {
    bio?: string | null
    imageUrl?: string | null
    phone?: string | null
  }
}

const EmployeeEditDialog = ({
  employeeId,
  employeeName,
  defaultValues,
}: EmployeeEditDialogProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState, reset } =
    useForm<UpdateEmployeeFormValues>({
      resolver: zodResolver(updateEmployeeSchema),
      defaultValues: {
        bio: defaultValues.bio ?? "",
        imageUrl: defaultValues.imageUrl ?? "",
        phone: defaultValues.phone ?? "",
      },
    })

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      reset({
        bio: defaultValues.bio ?? "",
        imageUrl: defaultValues.imageUrl ?? "",
        phone: defaultValues.phone ?? "",
      })
    }
  }

  const onSubmit = async (values: UpdateEmployeeFormValues) => {
    setIsSubmitting(true)

    try {
      await updateEmployee(employeeId, values)
      toast.success("Funcionário atualizado com sucesso!")
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar funcionário.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={(triggerProps) => (
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
      <DialogContent className="w-[90%] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar {employeeName}</DialogTitle>
          <DialogDescription>
            Atualize as informações do funcionário.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 text-left"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-1">
            <Label htmlFor="edit-employee-phone">Telefone (opcional)</Label>
            <Input
              id="edit-employee-phone"
              type="tel"
              placeholder="(11) 91234-5678"
              {...register("phone")}
            />
            {formState.errors.phone && (
              <p className="text-destructive text-xs">
                {formState.errors.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-employee-bio">Bio (opcional)</Label>
            <Textarea id="edit-employee-bio" rows={3} {...register("bio")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-employee-image">
              URL da imagem (opcional)
            </Label>
            <Input
              id="edit-employee-image"
              type="text"
              placeholder="https://..."
              {...register("imageUrl")}
            />
            {formState.errors.imageUrl && (
              <p className="text-destructive text-xs">
                {formState.errors.imageUrl.message}
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
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EmployeeEditDialog
