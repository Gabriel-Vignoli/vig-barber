"use client"

import { useState } from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { getPostLoginPath } from "../_actions/get-post-login-path"
import { checkLoginAttempt } from "../_actions/check-login-attempt"
import ForgotPasswordDialog from "./forgot-password-dialog"
import { formatCountdown, useLoginLockout } from "../_hooks/use-login-lockout"
import { loginSchema, LoginFormValues } from "../_lib/validations/auth"

interface LoginFormProps {
  // Already sanitised by the page (same-origin relative path or null)
  callbackUrl: string | null
}

const LoginForm = ({ callbackUrl }: LoginFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [visiblePassword, setVisiblePassword] = useState(false)

  const { register, handleSubmit, formState, watch } = useForm<LoginFormValues>(
    {
      resolver: zodResolver(loginSchema),
      defaultValues: { email: "", password: "" },
    },
  )

  const { isLocked, remainingSeconds, startLockout, clearLockout } =
    useLoginLockout(watch("email"))

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true)

    try {
      const attemptResult = await checkLoginAttempt(
        values.email,
        values.password,
      )

      if (attemptResult.status === "locked") {
        startLockout(values.email, attemptResult.lockedUntil)
        setIsSubmitting(false)
        return
      }

      clearLockout()

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

      // The callbackUrl when it is safe, otherwise the staff area (or /painel
      // for several shops), otherwise the home page
      const target = await getPostLoginPath(callbackUrl)

      // Full page navigation, the same thing a manual reload does. It skips the
      // client router cache (which can hold a stale "redirect to login" for
      // the admin area) and the push/refresh race. isSubmitting stays true on purpose,
      // so the spinner keeps showing until the browser leaves this page.
      window.location.assign(target)
    } catch {
      toast.error("Erro ao fazer login. Tente novamente.")
      setIsSubmitting(false)
    }
  }

  const handleGoogleClick = () => {
    sessionStorage.setItem("pending-auth-toast", "google")
    // Back to /login, which redirects a signed-in user to the same target
    signIn("google", {
      callbackUrl: callbackUrl
        ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/login",
    })
  }

  return (
    // ForgotPasswordDialog stays outside the <form>: React bubbles its inner
    // form submits through the portal, which would also submit the login.
    <div className="w-full max-w-sm space-y-4 xl:max-w-md xl:space-y-6">
      <Button
        type="button"
        variant="outline"
        className="w-full cursor-pointer gap-2 py-5 xl:p-6 xl:text-base"
        onClick={handleGoogleClick}
        disabled={isSubmitting}
      >
        <Image src="/google.svg" alt="" width={18} height={18} />
        Entrar com Google
      </Button>

      <div className="flex items-center gap-3">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs xl:text-base">ou</span>
        <div className="bg-border h-px flex-1" />
      </div>

      <form
        className="space-y-4 xl:space-y-6"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="space-y-1">
          <Label htmlFor="login-email" className="xl:text-base">
            Email
          </Label>
          <Input
            id="login-email"
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
          <Label htmlFor="login-password" className="xl:text-base">
            Senha
          </Label>
          <div className="relative">
            <Input
              id="login-password"
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
          {isLocked && (
            <p className="text-destructive text-xs xl:text-sm">
              Muitas tentativas de login. Tente novamente em{" "}
              {formatCountdown(remainingSeconds)}.
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer py-5 xl:p-6 xl:text-base"
          disabled={isSubmitting || isLocked}
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

export default LoginForm
