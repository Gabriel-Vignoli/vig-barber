"use server"

import { revalidateShop } from "../_lib/revalidate"
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

  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId },
    select: { id: true, barbershop: { select: { id: true, slug: true } } },
  })

  if (!review) {
    throw new Error("Avaliação não encontrada.")
  }

  await prisma.review.delete({ where: { id: review.id } })

  revalidateShop(review.barbershop)
}
