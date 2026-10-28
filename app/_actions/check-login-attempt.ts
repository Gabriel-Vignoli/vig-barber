"use server"

import { registerLoginAttempt } from "../_lib/login-attempt"

type CheckLoginAttemptResult =
  | { status: "ok"; role: string }
  | { status: "invalid" }
  | { status: "locked"; lockedUntil: string }

export async function checkLoginAttempt(
  email: string,
  password: string,
): Promise<CheckLoginAttemptResult> {
  const result = await registerLoginAttempt(email, password)

  if (result.status === "locked") {
    return { status: "locked", lockedUntil: result.lockedUntil.toISOString() }
  }

  if (result.status === "invalid") {
    return { status: "invalid" }
  }

  return { status: "ok", role: result.user.role }
}
