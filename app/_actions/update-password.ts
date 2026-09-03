"use server"

import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { prisma } from "../_lib/prisma"
import { updatePasswordFormSchema } from "../_lib/validations/profile"

interface UpdatePasswordInput {
  currentPassword?: string
  newPassword: string
  confirmNewPassword: string
}

export const updatePassword = async (input: UpdatePasswordInput) => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error("Usuário não autenticado")
  }

  const parsed = updatePasswordFormSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id

  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    throw new Error("Usuário não encontrado.")
  }

  // If the user already has a password, they must confirm the current one.
  // Users who signed up via Google (no password set) can set one directly.
  if (user.password) {
    if (!parsed.data.currentPassword) {
      throw new Error("Informe sua senha atual.")
    }

    const isValidPassword = await bcrypt.compare(
      parsed.data.currentPassword,
      user.password,
    )

    if (!isValidPassword) {
      throw new Error("Senha atual incorreta.")
    }
  }

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  })
}
