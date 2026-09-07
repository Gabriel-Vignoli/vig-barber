import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "./auth"
import { prisma } from "./prisma"

export const requireAdmin = async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/admin/login")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  })

  if (!user || user.role !== "ADMIN") {
    redirect("/")
  }

  return user
}
