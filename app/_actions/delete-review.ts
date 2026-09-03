"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { prisma } from "../_lib/prisma"

export const deleteReview = async (reviewId: string) => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error("Usuário não autenticado")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id

  const review = await prisma.review.findUnique({ where: { id: reviewId } })

  if (!review || review.userId !== userId) {
    throw new Error("Avaliação não encontrada.")
  }

  await prisma.review.delete({ where: { id: reviewId } })

  revalidatePath("/employees/[id]")
}
