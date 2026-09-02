"use client"

import { useState } from "react"
import Image from "next/image"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { signUp } from "../_actions/sign-up"

type Mode = "login" | "signup"

interface SignInDialogProps {
  initialMode?: Mode
}

const SignInDialog = ({ initialMode = "login" }: SignInDialogProps) => {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleLoginWithGoogleClick = () => signIn("google")

  const resetFields = () => {
    setName("")
    setEmail("")
    setPassword("")
    setConfirmPassword("")
  }

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
    resetFields()
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Email ou senha inválidos.")
        return
      }

      window.location.reload()
    } catch (error) {
      toast.error("Erro ao fazer login. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.")
      return
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    setIsSubmitting(true)

    try {
      await signUp({ name, email, password })

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(
          "Conta criada, mas não foi possível fazer login automaticamente.",
        )
        handleModeChange("login")
        return
      }

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
          onSubmit={handleLoginSubmit}
        >
          <div className="space-y-1">
            <Label htmlFor="login-email" className="xl:text-base">
              Email
            </Label>
            <Input
              id="login-email"
              type="email"
              className="xl:p-5 xl:text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="login-password" className="xl:text-base">
              Senha
            </Label>
            <Input
              id="login-password"
              className="xl:p-5 xl:text-base"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer gap-2 p-4 font-bold xl:p-5 xl:text-base"
            disabled={isSubmitting}
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
          onSubmit={handleSignUpSubmit}
        >
          <div className="space-y-1">
            <Label htmlFor="signup-name" className="xl:text-base">
              Nome
            </Label>
            <Input
              id="signup-name"
              type="text"
              className="xl:p-5 xl:text-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="signup-email" className="xl:text-base">
              Email
            </Label>
            <Input
              id="signup-email"
              type="email"
              className="xl:p-5 xl:text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="signup-password" className="xl:text-base">
              Senha
            </Label>
            <Input
              id="signup-password"
              type="password"
              className="xl:p-5 xl:text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="signup-confirm-password" className="xl:text-base">
              Confirmar senha
            </Label>
            <Input
              id="signup-confirm-password"
              type="password"
              className="xl:p-5 xl:text-base"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
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
    </>
  )
}

export default SignInDialog
