import { cache } from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "./auth"
import { prisma } from "./prisma"

// cache() dedupes these calls within a single request, so the layout and the
// page (and any nested server component) share ONE session read and ONE DB query
const getSession = cache(() => getServerSession(authOptions))

const getUserById = cache((id: string) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  }),
)

const getAuthenticatedUser = async () => {
  const session = await getSession()

  if (!session?.user) {
    redirect("/admin/login")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id as string

  return getUserById(userId)
}

export const requireAdmin = async () => {
  const user = await getAuthenticatedUser()

  if (!user || user.role !== "ADMIN") {
    redirect("/")
  }

  return user
}

export const requireAtendente = async () => {
  const user = await getAuthenticatedUser()

  if (!user || (user.role !== "ADMIN" && user.role !== "ATENDENTE")) {
    redirect("/")
  }

  return user
}
