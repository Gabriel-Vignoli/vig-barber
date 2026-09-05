"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"
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
import { requestPasswordReset } from "../_actions/request-password-reset"
import { verifyResetCode } from "../_actions/verify-reset-code"
import { resetPassword } from "../_actions/reset-password"
import {
  requestResetCodeSchema,
  verifyCodeSchema,
  resetPasswordSchema,
  RequestResetCodeFormValues,
  VerifyCodeFormValues,
  ResetPasswordFormValues,
} from "../_lib/validations/password-reset"

type Step = "request" | "verify-code" | "reset"

const ForgotPasswordDialog = () => {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("request")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [email, setEmail] = useState("")
  const [verifiedCode, setVerifiedCode] = useState("")
  const [visible, setVisible] = useState({ next: false, confirm: false })

  const requestForm = useForm<RequestResetCodeFormValues>({
    resolver: zodResolver(requestResetCodeSchema),
    defaultValues: { email: "" },
  })

  const verifyForm = useForm<VerifyCodeFormValues>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { email: "", code: "" },
  })

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      code: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  })

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setStep("request")
      requestForm.reset()
      verifyForm.reset()
      resetForm.reset()
      setEmail("")
      setVerifiedCode("")
    }
  }

  const onRequestSubmit = async (values: RequestResetCodeFormValues) => {
    setIsSubmitting(true)

    try {
      await requestPasswordReset(values)
      setEmail(values.email)
      verifyForm.setValue("email", values.email)
      toast.success("Se o email existir, um código foi enviado.")
      setStep("verify-code")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao enviar código.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const onVerifyCodeSubmit = async (values: VerifyCodeFormValues) => {
    setIsSubmitting(true)

    try {
      await verifyResetCode(values)
      setVerifiedCode(values.code)
      resetForm.setValue("email", values.email)
      resetForm.setValue("code", values.code)
      setStep("reset")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao verificar código.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const onResetSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true)

    try {
      await resetPassword(values)
      toast.success("Senha redefinida com sucesso!")
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao redefinir senha.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={(triggerProps) => (
          <button
            type="button"
            className="text-primary cursor-pointer text-xs font-semibold hover:underline xl:text-sm"
            {...triggerProps}
          >
            Esqueceu sua senha?
          </button>
        )}
      />
      <DialogContent className="bg-card border-primary/50 w-[90%] border-2 shadow-xl sm:max-w-md xl:max-w-lg xl:p-8">
        {step === "request" && (
          <>
            <DialogHeader>
              <DialogTitle className="xl:text-lg">Redefinir senha</DialogTitle>
              <DialogDescription className="xl:text-base">
                Informe seu email para receber um código de verificação.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-3 text-left xl:space-y-5"
              onSubmit={requestForm.handleSubmit(onRequestSubmit)}
              noValidate
            >
              <div className="space-y-1">
                <Label htmlFor="reset-request-email" className="xl:text-base">
                  Email
                </Label>
                <Input
                  id="reset-request-email"
                  type="email"
                  className="xl:p-5 xl:text-base"
                  {...requestForm.register("email")}
                />
                {requestForm.formState.errors.email && (
                  <p className="text-destructive text-xs">
                    {requestForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full cursor-pointer gap-2 p-4 font-bold xl:p-6 xl:text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  "Enviar código"
                )}
              </Button>
            </form>
          </>
        )}

        {step === "verify-code" && (
          <>
            <DialogHeader>
              <DialogTitle className="xl:text-lg">Digite o código</DialogTitle>
              <DialogDescription className="xl:text-base">
                Enviamos um código de 6 dígitos para {email}.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-3 text-left xl:space-y-5"
              onSubmit={verifyForm.handleSubmit(onVerifyCodeSubmit)}
              noValidate
            >
              <div className="space-y-1">
                <Label htmlFor="verify-code" className="xl:text-base">
                  Código
                </Label>
                <Input
                  id="verify-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="text-center text-lg tracking-[0.5em] xl:p-5 xl:text-xl"
                  {...verifyForm.register("code")}
                />
                {verifyForm.formState.errors.code && (
                  <p className="text-destructive text-xs">
                    {verifyForm.formState.errors.code.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full cursor-pointer gap-2 p-4 font-bold xl:p-6 xl:text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  "Validar código"
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep("request")}
                className="text-muted-foreground w-full cursor-pointer text-center text-xs hover:underline xl:text-sm"
              >
                Usar outro email
              </button>
            </form>
          </>
        )}

        {step === "reset" && (
          <>
            <DialogHeader>
              <DialogTitle className="xl:text-lg">Nova senha</DialogTitle>
              <DialogDescription className="xl:text-base">
                Código verificado. Defina sua nova senha.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-3 text-left xl:space-y-5"
              onSubmit={resetForm.handleSubmit(onResetSubmit)}
              noValidate
            >
              <div className="space-y-1">
                <Label htmlFor="reset-new-password" className="xl:text-base">
                  Nova senha
                </Label>
                <div className="relative">
                  <Input
                    id="reset-new-password"
                    type={visible.next ? "text" : "password"}
                    className="pr-10 xl:p-5 xl:text-base"
                    {...resetForm.register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setVisible((prev) => ({ ...prev, next: !prev.next }))
                    }
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                    tabIndex={-1}
                  >
                    {visible.next ? (
                      <EyeOffIcon size={18} />
                    ) : (
                      <EyeIcon size={18} />
                    )}
                  </button>
                </div>
                {resetForm.formState.errors.newPassword && (
                  <p className="text-destructive text-xs">
                    {resetForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="reset-confirm-password"
                  className="xl:text-base"
                >
                  Confirmar nova senha
                </Label>
                <div className="relative">
                  <Input
                    id="reset-confirm-password"
                    type={visible.confirm ? "text" : "password"}
                    className="pr-10 xl:p-5 xl:text-base"
                    {...resetForm.register("confirmNewPassword")}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setVisible((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                    tabIndex={-1}
                  >
                    {visible.confirm ? (
                      <EyeOffIcon size={18} />
                    ) : (
                      <EyeIcon size={18} />
                    )}
                  </button>
                </div>
                {resetForm.formState.errors.confirmNewPassword && (
                  <p className="text-destructive text-xs">
                    {resetForm.formState.errors.confirmNewPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full cursor-pointer gap-2 p-4 font-bold xl:p-6 xl:text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  "Redefinir senha"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ForgotPasswordDialog
