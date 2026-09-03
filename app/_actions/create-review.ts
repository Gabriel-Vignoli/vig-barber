"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { prisma } from "../_lib/prisma"
import { reviewFormSchema } from "../_lib/validations/review"

interface CreateReviewParams {
  bookingId: string
  employeeId: string
  rating: number
  comment?: string
}

export const createReview = async ({
  bookingId,
  employeeId,
  rating,
  comment,
}: CreateReviewParams) => {
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

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  })

  if (
    !booking ||
    booking.userId !== userId ||
    booking.employeeId !== employeeId
  ) {
    throw new Error("Reserva inválida para avaliação.")
  }

  await prisma.review.create({
    data: {
      bookingId,
      userId,
      employeeId,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
  })

  revalidatePath("/employees/[id]")
}
