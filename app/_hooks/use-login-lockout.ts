"use client"

import { useEffect, useState } from "react"

interface LockoutState {
  email: string
  until: number // epoch ms
}

export const formatCountdown = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

// Live countdown for a locked login. The lock only applies while the form
// still holds the email that got locked, so typing another email unlocks it.
export const useLoginLockout = (currentEmail: string) => {
  const [lockout, setLockout] = useState<LockoutState | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!lockout) return

    const interval = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= lockout.until) setLockout(null)
    }, 1000)
    return () => clearInterval(interval)
  }, [lockout])

  const isLocked =
    lockout !== null && lockout.email === currentEmail && now < lockout.until

  const remainingSeconds = isLocked
    ? Math.max(0, Math.ceil((lockout!.until - now) / 1000))
    : 0

  const startLockout = (email: string, lockedUntil: string) => {
    setLockout({ email, until: new Date(lockedUntil).getTime() })
    setNow(Date.now())
  }

  const clearLockout = () => setLockout(null)

  return { isLocked, remainingSeconds, startLockout, clearLockout }
}
