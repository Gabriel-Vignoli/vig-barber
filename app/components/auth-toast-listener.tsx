"use client"

import { useEffect } from "react"
import { showLoginSuccessToast } from "./login-success-toast"
import { showSignUpSuccessToast } from "./signup-success-toast"

const AUTH_TOAST_KEY = "pending-auth-toast"

export function AuthToastListener() {
  useEffect(() => {
    const pending = sessionStorage.getItem(AUTH_TOAST_KEY)

    if (pending === "login") {
      showLoginSuccessToast()
    } else if (pending === "signup") {
      showSignUpSuccessToast()
    }

    if (pending) {
      sessionStorage.removeItem(AUTH_TOAST_KEY)
    }
  }, [])

  return null
}
