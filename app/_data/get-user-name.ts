import { cache } from "react"
import { prisma } from "../_lib/prisma"

// Shared by the admin layout and pages: one query per request
export const getUserName = cache(async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })

  return user?.name ?? null
})
