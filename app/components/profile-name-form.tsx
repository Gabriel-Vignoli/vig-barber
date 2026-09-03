"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { updateProfile } from "../_actions/update-profile"
import {
  updateNameSchema,
  UpdateNameFormValues,
} from "../_lib/validations/profile"

interface ProfileNameFormProps {
  currentName: string
}

const ProfileNameForm = ({ currentName }: ProfileNameFormProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState } = useForm<UpdateNameFormValues>({
    resolver: zodResolver(updateNameSchema),
    defaultValues: { name: currentName },
  })

  const onSubmit = async (values: UpdateNameFormValues) => {
    setIsSubmitting(true)

    try {
      await updateProfile(values)
      toast.success("Nome atualizado com sucesso!")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar nome.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-1">
        <Label htmlFor="profile-name">Nome</Label>
        <Input id="profile-name" type="text" {...register("name")} />
        {formState.errors.name && (
          <p className="text-destructive text-xs">
            {formState.errors.name.message}
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
        ) : (
          "Salvar nome"
        )}
      </Button>
    </form>
  )
}

export default ProfileNameForm
