"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
} from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Checkbox } from "./ui/checkbox"
import { DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"
import { signUp } from "../_actions/sign-up"
import { checkLoginAttempt } from "../_actions/check-login-attempt"
import {
  loginSchema,
  signUpFormSchema,
  LoginFormValues,
  SignUpFormValues,
} from "../_lib/validations/auth"
import { PRIVACY_POLICY_SECTIONS } from "../_constants/privacy-policy"
import ForgotPasswordDialog from "./forgot-password-dialog"

type Mode = "login" | "signup"

interface SignInDialogProps {
  initialMode?: Mode
}

interface LockoutState {
  email: string
  until: number // epoch ms
}

const AUTH_TOAST_KEY = "pending-auth-toast"

const formatCountdown = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

const SignInDialog = ({ initialMode = "login" }: SignInDialogProps) => {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPolicyOpen, setIsPolicyOpen] = useState(false)
  const [lockout, setLockout] = useState<LockoutState | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isAdminPromptOpen, setIsAdminPromptOpen] = useState(false)
  const [pendingAdminLogin, setPendingAdminLogin] =
    useState<LoginFormValues | null>(null)

  const [visiblePasswords, setVisiblePasswords] = useState({
    loginPassword: false,
    signUpPassword: false,
    signUpConfirmPassword: false,
  })

  const togglePasswordVisibility = (field: keyof typeof visiblePasswords) => {
    setVisiblePasswords((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  })

  const loginEmail = loginForm.watch("email")

  useEffect(() => {
    if (!lockout) return

    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [lockout])

  useEffect(() => {
    if (lockout && now >= lockout.until) {
      setLockout(null)
    }
  }, [now, lockout])

  const isLockedForCurrentEmail =
    lockout !== null && lockout.email === loginEmail && now < lockout.until

  const remainingSeconds = isLockedForCurrentEmail
    ? Math.max(0, Math.ceil((lockout!.until - now) / 1000))
    : 0

  const handleLoginWithGoogleClick = () => {
    sessionStorage.setItem(AUTH_TOAST_KEY, "google")
    signIn("google")
  }

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
    loginForm.reset()
    signUpForm.reset()
    setIsPolicyOpen(false)
    setLoginError(null)
  }

  const proceedWithCredentialsSignIn = async (values: LoginFormValues) => {
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (result?.error) {
      setLockout(null)
      setLoginError("Email ou senha inválidos.")
      return
    }

    setLockout(null)
    sessionStorage.setItem(AUTH_TOAST_KEY, "login")
    window.location.reload()
  }

  const handleLoginSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true)
    setLoginError(null)

    try {
      const attemptResult = await checkLoginAttempt(
        values.email,
        values.password,
      )

      if (attemptResult.status === "locked") {
        setLockout({
          email: values.email,
          until: new Date(attemptResult.lockedUntil).getTime(),
        })
        setNow(Date.now())
        return
      }

      if (attemptResult.status === "invalid") {
        setLockout(null)
        setLoginError("Email ou senha inválidos.")
        return
      }

      if (attemptResult.role === "ADMIN") {
        setPendingAdminLogin(values)
        setIsAdminPromptOpen(true)
        return
      }

      await proceedWithCredentialsSignIn(values)
    } catch (error) {
      setLoginError("Erro ao fazer login. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoToAdminLogin = () => {
    setIsAdminPromptOpen(false)
    setPendingAdminLogin(null)
    router.push("/admin/login")
  }

  const handleTryAnotherEmail = () => {
    setIsAdminPromptOpen(false)
    setPendingAdminLogin(null)
    loginForm.reset()
  }

  const handleSignUpSubmit = async (values: SignUpFormValues) => {
    setIsSubmitting(true)

    try {
      await signUp({
        name: values.name,
        email: values.email,
        password: values.password,
        acceptTerms: values.acceptTerms,
      })

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(
          "Conta criada, mas não foi possível fazer login automaticamente.",
        )
        handleModeChange("login")
        return
      }

      sessionStorage.setItem(AUTH_TOAST_KEY, "signup")
      window.location.reload()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar conta.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="xl:text-lg">
          {mode === "login" ? "Faça login na plataforma" : "Crie sua conta"}
        </DialogTitle>
        <DialogDescription className="xl:text-base">
          {mode === "login"
            ? "Conecte-se com o Google ou com seu email e senha"
            : "Cadastre-se para começar a agendar"}
        </DialogDescription>
      </DialogHeader>

      <Button
        variant="outline"
        className="font-bol cursor-pointer gap-2 p-4 xl:p-5 xl:text-base"
        onClick={handleLoginWithGoogleClick}
      >
        <Image
          src="/google.svg"
          alt="Google Icon"
          width={18}
          height={18}
        ></Image>
        Google
      </Button>

      <div className="flex items-center gap-3">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs xl:text-base">ou</span>
        <div className="bg-border h-px flex-1" />
      </div>

      {mode === "login" ? (
        <form
          className="space-y-3 text-left xl:space-y-5"
          onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
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
              {...loginForm.register("email")}
            />
            {loginForm.formState.errors.email && (
              <p className="text-destructive text-xs">
                {loginForm.formState.errors.email.message}
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
                className="pr-10 xl:p-5 xl:text-base"
                type={visiblePasswords.loginPassword ? "text" : "password"}
                {...loginForm.register("password")}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("loginPassword")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                tabIndex={-1}
              >
                {visiblePasswords.loginPassword ? (
                  <EyeOffIcon size={18} />
                ) : (
                  <EyeIcon size={18} />
                )}
              </button>
            </div>
            {loginForm.formState.errors.password && (
              <p className="text-destructive text-xs">
                {loginForm.formState.errors.password.message}
              </p>
            )}
            {loginError && !isLockedForCurrentEmail && (
              <p className="text-destructive text-xs">{loginError}</p>
            )}
            {isLockedForCurrentEmail && (
              <p className="text-destructive text-xs">
                Muitas tentativas de login. Tente novamente em{" "}
                {formatCountdown(remainingSeconds)}.
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer gap-2 p-4 font-bold xl:p-5 xl:text-base"
            disabled={isSubmitting || isLockedForCurrentEmail}
          >
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      ) : (
        <form
          className="space-y-3 text-left xl:space-y-5"
          onSubmit={signUpForm.handleSubmit(handleSignUpSubmit)}
          noValidate
        >
          <div className="space-y-1">
            <Label htmlFor="signup-name" className="xl:text-base">
              Nome
            </Label>
            <Input
              id="signup-name"
              type="text"
              className="xl:p-5 xl:text-base"
              {...signUpForm.register("name")}
            />
            {signUpForm.formState.errors.name && (
              <p className="text-destructive text-xs">
                {signUpForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="signup-email" className="xl:text-base">
              Email
            </Label>
            <Input
              id="signup-email"
              type="email"
              className="xl:p-5 xl:text-base"
              {...signUpForm.register("email")}
            />
            {signUpForm.formState.errors.email && (
              <p className="text-destructive text-xs">
                {signUpForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="signup-password" className="xl:text-base">
              Senha
            </Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={visiblePasswords.signUpPassword ? "text" : "password"}
                className="pr-10 xl:p-5 xl:text-base"
                {...signUpForm.register("password")}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("signUpPassword")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                tabIndex={-1}
              >
                {visiblePasswords.signUpPassword ? (
                  <EyeOffIcon size={18} />
                ) : (
                  <EyeIcon size={18} />
                )}
              </button>
            </div>
            {signUpForm.formState.errors.password && (
              <p className="text-destructive text-xs">
                {signUpForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="signup-confirm-password" className="xl:text-base">
              Confirmar senha
            </Label>
            <div className="relative">
              <Input
                id="signup-confirm-password"
                type={
                  visiblePasswords.signUpConfirmPassword ? "text" : "password"
                }
                className="pr-10 xl:p-5 xl:text-base"
                {...signUpForm.register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() =>
                  togglePasswordVisibility("signUpConfirmPassword")
                }
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                tabIndex={-1}
              >
                {visiblePasswords.signUpConfirmPassword ? (
                  <EyeOffIcon size={18} />
                ) : (
                  <EyeIcon size={18} />
                )}
              </button>
            </div>
            {signUpForm.formState.errors.confirmPassword && (
              <p className="text-destructive text-xs">
                {signUpForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <Checkbox
                id="signup-accept-terms"
                checked={signUpForm.watch("acceptTerms")}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  signUpForm.setValue("acceptTerms", checked === true, {
                    shouldValidate: true,
                  })
                }
              />
              <Label
                htmlFor="signup-accept-terms"
                className="text-muted-foreground text-xs leading-snug font-normal xl:text-sm"
              >
                Eu li e aceito a política de privacidade.
              </Label>
            </div>

            <button
              type="button"
              onClick={() => setIsPolicyOpen((prev) => !prev)}
              className="text-primary flex cursor-pointer items-center gap-1 text-xs font-semibold xl:text-sm"
            >
              {isPolicyOpen ? "Ocultar" : "Ler"} política de privacidade
              {isPolicyOpen ? (
                <ChevronUpIcon size={14} />
              ) : (
                <ChevronDownIcon size={14} />
              )}
            </button>

            {isPolicyOpen && (
              <div className="bg-muted/50 max-h-40 space-y-3 overflow-y-auto rounded-lg p-3 text-xs">
                {PRIVACY_POLICY_SECTIONS.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <p className="text-foreground font-semibold">
                      {section.title}
                    </p>
                    <p className="text-muted-foreground">{section.content}</p>
                  </div>
                ))}
              </div>
            )}

            {signUpForm.formState.errors.acceptTerms && (
              <p className="text-destructive text-xs">
                {signUpForm.formState.errors.acceptTerms.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer gap-2 p-4 font-bold xl:p-5 xl:text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              "Criar conta"
            )}
          </Button>
        </form>
      )}

      <p className="text-muted-foreground text-center text-sm xl:text-base">
        {mode === "login" ? (
          <>
            Não tem uma conta?{" "}
            <button
              type="button"
              className="text-primary cursor-pointer font-semibold hover:underline"
              onClick={() => handleModeChange("signup")}
            >
              Criar conta
            </button>
          </>
        ) : (
          <>
            Já tem uma conta?{" "}
            <button
              type="button"
              className="text-primary cursor-pointer font-semibold hover:underline"
              onClick={() => handleModeChange("login")}
            >
              Fazer login
            </button>
          </>
        )}
      </p>
      <div className="flex justify-end">
        <ForgotPasswordDialog />
      </div>

      <AlertDialog open={isAdminPromptOpen} onOpenChange={setIsAdminPromptOpen}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle>Conta de administrador</AlertDialogTitle>
            <AlertDialogDescription>
              Essa conta pertence a um administrador. Deseja acessar o painel
              administrativo ou tentar novamente com outro email?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleTryAnotherEmail}>
              Tentar outro email
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleGoToAdminLogin}>
              Ir para o painel admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default SignInDialog
