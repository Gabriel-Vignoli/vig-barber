"use server"

import bcrypt from "bcryptjs"
import { prisma } from "../_lib/prisma"
import { validateResetCode } from "../_lib/reset-code"
import { findAccountByEmail } from "../_lib/email-match"
import { resetPasswordSchema } from "../_lib/validations/password-reset"
import { action, ActionError } from "../_lib/action-result"

export const resetPassword = action(
  async (input: {
    email: string
    code: string
    newPassword: string
    confirmNewPassword: string
  }) => {
    const parsed = resetPasswordSchema.safeParse(input)

    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0].message)
    }

    const { email, code, newPassword } = parsed.data

    const resetCode = await validateResetCode(email, code)

    const user = await findAccountByEmail(email)

    if (!user) {
      throw new ActionError("Usuário não encontrado.")
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        // A successful reset also lifts any login lockout
        data: {
          password: hashedPassword,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.passwordResetCode.update({
        where: { id: resetCode.id },
        data: { usedAt: new Date() },
      }),
    ])
  },
)
