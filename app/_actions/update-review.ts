"use server"

import { revalidateShop } from "../_lib/revalidate"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { prisma } from "../_lib/prisma"
import { reviewFormSchema } from "../_lib/validations/review"

interface UpdateReviewParams {
  reviewId: string
  rating: number
  comment?: string
}

export const updateReview = async ({
  reviewId,
  rating,
  comment,
}: UpdateReviewParams) => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error("Usuário não autenticado")
  }

  const parsed = reviewFormSchema.safeParse({ rating, comment })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
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

  await prisma.review.update({
    where: { id: review.id },
    data: { rating: parsed.data.rating, comment: parsed.data.comment || null },
  })

  revalidateShop(review.barbershop)
}
