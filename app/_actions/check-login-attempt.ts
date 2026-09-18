"use server"

import { prisma } from "../_lib/prisma"
import bcrypt from "bcryptjs"

const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MS = 10 * 60 * 1000 // 10 minutes

type CheckLoginAttemptResult =
  | { status: "ok" }
  | { status: "invalid" }
  | { status: "locked"; lockedUntil: string }

export async function checkLoginAttempt(
  email: string,
  password: string,
): Promise<CheckLoginAttemptResult> {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.password) {
    return { status: "invalid" }
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { status: "locked", lockedUntil: user.lockedUntil.toISOString() }
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
      return {
        status: "locked",
        lockedUntil: updated.lockedUntil.toISOString(),
      }
    }

    return { status: "invalid" }
  }

  // Correct password — reset the counter now. authorize() will re-verify
  // the password again right after, which is redundant but harmless.
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  })

  return { status: "ok" }
}
