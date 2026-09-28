"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { EyeIcon, EyeOffIcon, Loader2Icon, PlusIcon } from "lucide-react"
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
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState, reset } =
    useForm<CreateEmployeeFormValues>({
      resolver: zodResolver(createEmployeeSchema),
      defaultValues: {
        name: "",
        email: "",
        password: "",
        bio: "",
        imageUrl: "",
        phone: "",
      },
    })

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      reset()
      setShowPassword(false)
    }
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
          <Button
            className="cursor-pointer border-0 xl:p-4 xl:text-base"
            {...triggerProps}
          >
            <PlusIcon className="size-4.5 xl:size-5" />
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
            <Label htmlFor="employee-password">Senha</Label>
            <div className="relative">
              <Input
                id="employee-password"
                type={showPassword ? "text" : "password"}
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOffIcon size={18} />
                ) : (
                  <EyeIcon size={18} />
                )}
              </button>
            </div>
            {formState.errors.password && (
              <p className="text-destructive text-xs">
                {formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="employee-phone">Telefone (opcional)</Label>
            <Input
              id="employee-phone"
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
