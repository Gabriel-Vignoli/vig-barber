"use server"

import bcrypt from "bcryptjs"
import { prisma } from "../_lib/prisma"
import { resetPasswordSchema } from "./password-reset"

export const resetPassword = async (input: {
  email: string
  code: string
  newPassword: string
  confirmNewPassword: string
}) => {
  const parsed = resetPasswordSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const { email, code, newPassword } = parsed.data

  const resetCode = await prisma.passwordResetCode.findFirst({
    where: { email, code, usedAt: null },
    orderBy: { createdAt: "desc" },
  })

  if (!resetCode) {
    throw new Error("Código inválido.")
  }

  if (resetCode.expiresAt < new Date()) {
    throw new Error("Código expirado. Solicite um novo.")
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    throw new Error("Usuário não encontrado.")
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetCode.update({
      where: { id: resetCode.id },
      data: { usedAt: new Date() },
    }),
  ])
}
