"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
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
import { createEmployee } from "../_actions/create-employee"
import {
  createEmployeeSchema,
  CreateEmployeeFormValues,
} from "../_lib/validations/employee"

const EmployeeFormDialog = () => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState, reset } =
    useForm<CreateEmployeeFormValues>({
      resolver: zodResolver(createEmployeeSchema),
      defaultValues: { name: "", email: "", bio: "", imageUrl: "" },
    })

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) reset()
  }

  const onSubmit = async (values: CreateEmployeeFormValues) => {
    setIsSubmitting(true)

    try {
      await createEmployee(values)
      toast.success("Funcionário criado com sucesso!")
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar funcionário.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={(triggerProps) => (
          <Button className="cursor-pointer gap-2" {...triggerProps}>
            <PlusIcon size={18} />
            Novo funcionário
          </Button>
        )}
      />
      <DialogContent className="w-[90%] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo funcionário</DialogTitle>
          <DialogDescription>
            Cria um usuário com papel de funcionário.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 text-left"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-1">
            <Label htmlFor="employee-name">Nome</Label>
            <Input id="employee-name" type="text" {...register("name")} />
            {formState.errors.name && (
              <p className="text-destructive text-xs">
                {formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="employee-email">Email</Label>
            <Input id="employee-email" type="email" {...register("email")} />
            {formState.errors.email && (
              <p className="text-destructive text-xs">
                {formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="employee-bio">Bio (opcional)</Label>
            <Textarea id="employee-bio" rows={3} {...register("bio")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="employee-image">URL da imagem (opcional)</Label>
            <Input
              id="employee-image"
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
              "Criar funcionário"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EmployeeFormDialog
