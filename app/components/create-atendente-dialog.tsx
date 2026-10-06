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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { createAtendente } from "../_actions/create-atendente"
import {
  createAtendenteSchema,
  CreateAtendenteFormValues,
} from "../_lib/validations/atendente"

const CreateAtendenteDialog = () => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState, reset } =
    useForm<CreateAtendenteFormValues>({
      resolver: zodResolver(createAtendenteSchema),
      defaultValues: { name: "", email: "", password: "" },
    })

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      reset()
      setShowPassword(false)
    }
  }

  const onSubmit = async (values: CreateAtendenteFormValues) => {
    setIsSubmitting(true)

    try {
      await createAtendente(values)
      toast.success("Atendente criado com sucesso!")
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar atendente.",
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
            Novo atendente
          </Button>
        )}
      />
      <DialogContent className="w-[90%] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo atendente</DialogTitle>
          <DialogDescription>
            Cria um usuário com acesso apenas ao agendamento para clientes.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 text-left"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-1">
            <Label htmlFor="atendente-name">Nome</Label>
            <Input id="atendente-name" type="text" {...register("name")} />
            {formState.errors.name && (
              <p className="text-destructive text-xs">
                {formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="atendente-email">Email</Label>
            <Input id="atendente-email" type="email" {...register("email")} />
            {formState.errors.email && (
              <p className="text-destructive text-xs">
                {formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="atendente-password">Senha</Label>
            <div className="relative">
              <Input
                id="atendente-password"
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

          <Button
            type="submit"
            className="w-full cursor-pointer py-5"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              "Criar atendente"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateAtendenteDialog
