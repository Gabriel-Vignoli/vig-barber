"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { prisma } from "../_lib/prisma"
import { updateNameSchema } from "../_lib/validations/profile"
import { action, ActionError } from "../_lib/action-result"

interface UpdateProfileInput {
  name: string
}

export const updateProfile = action(async (input: UpdateProfileInput) => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new ActionError("Usuário não autenticado")
  }

  const parsed = updateNameSchema.safeParse(input)

  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0].message)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id

  await prisma.user.update({
    where: { id: userId },
    data: { name: parsed.data.name },
  })

  revalidatePath("/profile")
})
