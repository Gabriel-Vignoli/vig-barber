import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MS = 10 * 60 * 1000 // 10 minutes

// Checks the password and keeps the lockout counters up to date. Shared by the
// checkLoginAttempt action (UI pre-check) and the credentials authorize(), so
// calling signIn directly can't skip the lockout.
export const registerLoginAttempt = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.password) {
    return { status: "invalid" as const }
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { status: "locked" as const, lockedUntil: user.lockedUntil }
  }

  const isValidPassword = await bcrypt.compare(password, user.password)

  if (!isValidPassword) {
    const attempts = user.failedLoginAttempts + 1

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil:
          attempts >= MAX_LOGIN_ATTEMPTS
            ? new Date(Date.now() + LOCK_DURATION_MS)
            : null,
      },
    })

    if (updated.lockedUntil) {
      return { status: "locked" as const, lockedUntil: updated.lockedUntil }
    }

    return { status: "invalid" as const }
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    })
  }

  return { status: "ok" as const, user }
}
