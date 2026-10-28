"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { getCurrentUserRole } from "../_actions/get-user-role"
import { checkLoginAttempt } from "../_actions/check-login-attempt"
import ForgotPasswordDialog from "./forgot-password-dialog"
import {
  adminLoginSchema,
  AdminLoginFormValues,
} from "../_lib/validations/admin-login"

const getMinutesUntil = (isoDate: string) =>
  Math.max(1, Math.ceil((new Date(isoDate).getTime() - Date.now()) / 60000))

const AdminLoginForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [visiblePassword, setVisiblePassword] = useState(false)

  const { register, handleSubmit, formState } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: AdminLoginFormValues) => {
    setIsSubmitting(true)

    try {
      const attemptResult = await checkLoginAttempt(
        values.email,
        values.password,
      )

      if (attemptResult.status === "locked") {
        const minutes = getMinutesUntil(attemptResult.lockedUntil)
        toast.error(
          `Conta bloqueada. Tente novamente em ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`,
        )
        setIsSubmitting(false)
        return
      }

      if (attemptResult.status === "invalid") {
        toast.error("Email ou senha inválidos.")
        setIsSubmitting(false)
        return
      }

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Email ou senha inválidos.")
        setIsSubmitting(false)
        return
      }

      const role = await getCurrentUserRole()
      const target = role === "ATENDENTE" ? "/admin/atendente" : "/admin"

      // Full page navigation, the same thing a manual reload does. It skips the
      // client router cache (which can hold a stale "redirect to login" for
      // /admin) and the push/refresh race. isSubmitting stays true on purpose,
      // so the spinner keeps showing until the browser leaves this page.
      window.location.assign(target)
    } catch {
      toast.error("Erro ao fazer login. Tente novamente.")
      setIsSubmitting(false)
    }
  }

  return (
    // ForgotPasswordDialog stays outside the <form>: React bubbles its inner
    // form submits through the portal, which would also submit the login.
    <div className="w-full max-w-sm space-y-4 xl:max-w-md xl:space-y-6">
      <form
        className="space-y-4 xl:space-y-6"
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
              {visiblePassword ? (
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

      <div className="flex justify-end">
        <ForgotPasswordDialog />
      </div>
    </div>
  )
}

export default AdminLoginForm
