"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { prisma } from "../_lib/prisma"
import { phoneFormSchema } from "../_lib/validations/phone"
import { action, ActionError } from "../_lib/action-result"

export const updatePhone = action(async (input: { phone: string }) => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new ActionError("Usuário não autenticado")
  }

  const parsed = phoneFormSchema.safeParse(input)

  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0].message)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id

  await prisma.user.update({
    where: { id: userId },
    data: { phone: parsed.data.phone },
  })
})
