"use server"

import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { prisma } from "../_lib/prisma"
import { updatePasswordFormSchema } from "../_lib/validations/profile"
import { action, ActionError } from "../_lib/action-result"

interface UpdatePasswordInput {
  currentPassword?: string
  newPassword: string
  confirmNewPassword: string
}

export const updatePassword = action(async (input: UpdatePasswordInput) => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new ActionError("Usuário não autenticado")
  }

  const parsed = updatePasswordFormSchema.safeParse(input)

  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0].message)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id

  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    throw new ActionError("Usuário não encontrado.")
  }

  // If the user already has a password, they must confirm the current one.
  // Users who signed up via Google (no password set) can set one directly.
  if (user.password) {
    if (!parsed.data.currentPassword) {
      throw new ActionError("Informe sua senha atual.")
    }

    const isValidPassword = await bcrypt.compare(
      parsed.data.currentPassword,
      user.password,
    )

    if (!isValidPassword) {
      throw new ActionError("Senha atual incorreta.")
    }
  }

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  })
})
