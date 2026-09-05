"use server"

import { prisma } from "../_lib/prisma"

export const verifyResetCode = async (input: {
  email: string
  code: string
}) => {
  const resetCode = await prisma.passwordResetCode.findFirst({
    where: { email: input.email, code: input.code, usedAt: null },
    orderBy: { createdAt: "desc" },
  })

  if (!resetCode) {
    throw new Error("Código inválido.")
  }

  if (resetCode.expiresAt < new Date()) {
    throw new Error("Código expirado. Solicite um novo.")
  }
}
