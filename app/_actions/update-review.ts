"use server"

import { revalidatePath } from "next/cache"
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

  const review = await prisma.review.findUnique({ where: { id: reviewId } })

  if (!review || review.userId !== userId) {
    throw new Error("Avaliação não encontrada.")
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: { rating: parsed.data.rating, comment: parsed.data.comment || null },
  })

  revalidatePath("/employees/[id]")
}
