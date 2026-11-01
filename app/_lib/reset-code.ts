import { prisma } from "./prisma"
import { ActionError } from "./action-result"

const MAX_CODE_ATTEMPTS = 5

// Checks the latest unused code for the email. Wrong guesses count against
// that code, and after MAX_CODE_ATTEMPTS it is burned, so the 6-digit code
// can't be brute-forced while it's still valid.
export const validateResetCode = async (email: string, code: string) => {
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

  if (resetCode.code !== code) {
    const attempts = resetCode.failedAttempts + 1

    await prisma.passwordResetCode.update({
      where: { id: resetCode.id },
      data: {
        failedAttempts: attempts,
        usedAt: attempts >= MAX_CODE_ATTEMPTS ? new Date() : null,
      },
    })

    if (attempts >= MAX_CODE_ATTEMPTS) {
      throw new ActionError("Muitas tentativas. Solicite um novo código.")
    }

    throw new ActionError("Código inválido.")
  }

  return resetCode
}
