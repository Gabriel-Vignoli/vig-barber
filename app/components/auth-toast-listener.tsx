"use client"

import { useEffect } from "react"
import { LogOutIcon } from "lucide-react"
import { showFeedbackToast } from "./feedback-toast"

const AUTH_TOAST_KEY = "pending-auth-toast"

// Shown after the full page load that follows sign-in, sign-up and sign-out
const AUTH_TOASTS = {
  login: {
    variant: "success",
    title: "Login realizado!",
    description: "Bem-vindo de volta.",
  },
  signup: {
    variant: "success",
    title: "Conta criada!",
    description: "Sua conta foi criada e você já está logado.",
  },
  google: {
    variant: "success",
    title: "Login realizado!",
    description: "Você entrou com sua conta do Google.",
  },
  accountDeleted: {
    variant: "neutral",
    title: "Conta excluída",
    description: "Seus dados pessoais foram apagados.",
    icon: LogOutIcon,
  },
  logout: {
    variant: "neutral",
    title: "Você saiu da conta",
    description: "Até a próxima!",
    icon: LogOutIcon,
  },
} as const

export function AuthToastListener() {
  useEffect(() => {
    const pending = sessionStorage.getItem(AUTH_TOAST_KEY)

    if (pending && pending in AUTH_TOASTS) {
      showFeedbackToast(AUTH_TOASTS[pending as keyof typeof AUTH_TOASTS])
    }

    if (pending) {
      sessionStorage.removeItem(AUTH_TOAST_KEY)
    }
  }, [])

  return null
}
