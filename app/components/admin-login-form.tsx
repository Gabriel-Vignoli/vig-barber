"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
  adminLoginSchema,
  AdminLoginFormValues,
} from "../_lib/validations/admin-login"

const AdminLoginForm = () => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [visiblePassword, setVisiblePassword] = useState(false)

  const { register, handleSubmit, formState } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: AdminLoginFormValues) => {
    setIsSubmitting(true)

    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Email ou senha inválidos.")
        return
      }

      router.push("/admin")
      router.refresh()
    } catch (error) {
      toast.error("Erro ao fazer login. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className="w-full max-w-sm space-y-4 xl:max-w-md xl:space-y-6"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div className="space-y-1">
        <Label htmlFor="admin-login-email" className="xl:text-base">
          Email
        </Label>
        <Input
          id="admin-login-email"
          type="email"
          className="xl:p-5 xl:text-base"
          {...register("email")}
        />
        {formState.errors.email && (
          <p className="text-destructive text-xs">
            {formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="admin-login-password" className="xl:text-base">
          Senha
        </Label>
        <div className="relative">
          <Input
            id="admin-login-password"
            type={visiblePassword ? "text" : "password"}
            className="pr-10 xl:p-5 xl:text-base"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setVisiblePassword((prev) => !prev)}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
            tabIndex={-1}
          >
            {visiblePassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
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
        className="w-full cursor-pointer py-5 xl:p-6 xl:text-base"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  )
}

export default AdminLoginForm
