import { cache } from "react"
import { prisma } from "../_lib/prisma"

export const getUserEmail = cache(async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  return user?.email ?? null
})
