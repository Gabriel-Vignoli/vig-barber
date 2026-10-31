import { cache } from "react"
import { notFound, redirect } from "next/navigation"
import { prisma } from "./prisma"
import { getLoginPath } from "./protected-paths"
import { getSessionUserId } from "./tenant"

// Read from the database on every request (never from the JWT), so revoking
// the flag takes effect immediately
const isPlatformAdmin = cache(async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPlatformAdmin: true },
  })

  return user?.isPlatformAdmin === true
})

// For pages under /platform: signed-out users go to /login, everyone else
// who is not a platform admin gets a 404 (the panel is not advertised)
export const requirePlatformAdmin = async (): Promise<{ userId: string }> => {
  const userId = await getSessionUserId()

  if (!userId) {
    redirect(getLoginPath("/platform"))
  }

  if (!(await isPlatformAdmin(userId))) {
    notFound()
  }

  return { userId }
}

// For platform server actions: throws pt-BR errors
export const assertPlatformAdmin = async (): Promise<{ userId: string }> => {
  const userId = await getSessionUserId()

  if (!userId) {
    throw new Error("Você precisa estar logado.")
  }

  if (!(await isPlatformAdmin(userId))) {
    throw new Error("Sem permissão.")
  }

  return { userId }
}
