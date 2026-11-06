import { prisma } from "./prisma"
import { ActionError } from "./action-result"
import { keyedHash } from "./keyed-hash"
import { findAccountByEmail } from "./email-match"
import { assertRateLimit, getClientIp } from "./rate-limit"

const MAX_CODE_ATTEMPTS = 5

// With only a million possible codes, a plain hash would be reversed in
// seconds; the keyed one is useless without the server secret.
export const hashResetCode = (email: string, code: string) =>
  keyedHash(`reset-code:${email}:${code}`)

// Checks the latest unused code for the email. Wrong guesses count against
// that code, and after MAX_CODE_ATTEMPTS it is burned, so the 6-digit code
// can't be brute-forced while it's still valid.
export const validateResetCode = async (typedEmail: string, code: string) => {
  await assertRateLimit("verify-ip", await getClientIp(), {
    limit: 20,
    windowMs: 15 * 60 * 1000,
  })

  // Codes are stored under the account's email, as it was typed at sign-up
  const account = await findAccountByEmail(typedEmail)
  const email = account?.email ?? typedEmail

  const resetCode = await prisma.passwordResetCode.findFirst({
    where: { email, usedAt: null },
    orderBy: { createdAt: "desc" },
  })

  if (!resetCode) {
    throw new ActionError("Código inválido.")
  }

  if (resetCode.expiresAt < new Date()) {
    throw new ActionError("Código expirado. Solicite um novo.")
  }

  // Each guess reserves an attempt before it is compared, so a parallel burst
  // gets MAX_CODE_ATTEMPTS comparisons and no more
  const { count: reserved } = await prisma.passwordResetCode.updateMany({
    where: {
      id: resetCode.id,
      usedAt: null,
      failedAttempts: { lt: MAX_CODE_ATTEMPTS },
    },
    data: { failedAttempts: { increment: 1 } },
  })

  if (reserved === 0) {
    throw new ActionError("Código inválido.")
  }

  if (resetCode.code !== hashResetCode(email, code)) {
    const { count: burned } = await prisma.passwordResetCode.updateMany({
      where: {
        id: resetCode.id,
        usedAt: null,
        failedAttempts: { gte: MAX_CODE_ATTEMPTS },
      },
      data: { usedAt: new Date() },
    })

    if (burned > 0) {
      throw new ActionError("Muitas tentativas. Solicite um novo código.")
    }

    throw new ActionError("Código inválido.")
  }

  // A right code is not a failed attempt: the reset screen checks it again
  await prisma.passwordResetCode.update({
    where: { id: resetCode.id },
    data: { failedAttempts: { decrement: 1 } },
  })

  return resetCode
}
