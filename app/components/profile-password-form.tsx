"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { updatePassword } from "../_actions/update-password"
import {
  updatePasswordFormSchema,
  UpdatePasswordFormValues,
} from "../_lib/validations/profile"

interface ProfilePasswordFormProps {
  hasPassword: boolean
}

const ProfilePasswordForm = ({ hasPassword }: ProfilePasswordFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [visible, setVisible] = useState({
    current: false,
    next: false,
    confirm: false,
  })

  const toggleVisible = (field: keyof typeof visible) => {
    setVisible((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const { register, handleSubmit, formState, reset } =
    useForm<UpdatePasswordFormValues>({
      resolver: zodResolver(updatePasswordFormSchema),
      defaultValues: {
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      },
    })

  const onSubmit = async (values: UpdatePasswordFormValues) => {
    setIsSubmitting(true)

    try {
      await updatePassword(values)
      toast.success(
        hasPassword
          ? "Senha atualizada com sucesso!"
          : "Senha definida com sucesso!",
      )
      reset()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar senha.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
      {hasPassword && (
        <div className="space-y-1">
          <Label htmlFor="current-password">Senha atual</Label>
          <div className="relative">
            <Input
              id="current-password"
              type={visible.current ? "text" : "password"}
              className="pr-10"
              {...register("currentPassword")}
            />
            <button
              type="button"
              onClick={() => toggleVisible("current")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
              tabIndex={-1}
            >
              {visible.current ? (
                <EyeOffIcon size={18} />
              ) : (
                <EyeIcon size={18} />
              )}
            </button>
          </div>
          {formState.errors.currentPassword && (
            <p className="text-destructive text-xs">
              {formState.errors.currentPassword.message}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="new-password">
          {hasPassword ? "Nova senha" : "Senha"}
        </Label>
        <div className="relative">
          <Input
            id="new-password"
            type={visible.next ? "text" : "password"}
            className="pr-10"
            {...register("newPassword")}
          />
          <button
            type="button"
            onClick={() => toggleVisible("next")}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
            tabIndex={-1}
          >
            {visible.next ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        </div>
        {formState.errors.newPassword && (
          <p className="text-destructive text-xs">
            {formState.errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="confirm-new-password">
          {hasPassword ? "Confirmar nova senha" : "Confirmar senha"}
        </Label>
        <div className="relative">
          <Input
            id="confirm-new-password"
            type={visible.confirm ? "text" : "password"}
            className="pr-10"
            {...register("confirmNewPassword")}
          />
          <button
            type="button"
            onClick={() => toggleVisible("confirm")}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
            tabIndex={-1}
          >
            {visible.confirm ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        </div>
        {formState.errors.confirmNewPassword && (
          <p className="text-destructive text-xs">
            {formState.errors.confirmNewPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="cursor-pointer gap-2"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : hasPassword ? (
          "Atualizar senha"
        ) : (
          "Definir senha"
        )}
      </Button>
    </form>
  )
}

export default ProfilePasswordForm
