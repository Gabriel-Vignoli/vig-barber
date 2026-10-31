"use server"

import { revalidateShop } from "../_lib/revalidate"
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

  // Only the user's own past, non-cancelled booking with this employee (the
  // same rule the employee page uses to offer the review form)
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId,
      employeeId,
      status: { not: "CANCELLED" },
      bookingDate: { lt: new Date() },
    },
    select: {
      barbershopId: true,
      barbershop: { select: { id: true, slug: true, status: true } },
      review: { select: { id: true } },
    },
  })

  if (!booking) {
    throw new Error("Reserva inválida para avaliação.")
  }

  if (booking.barbershop.status !== "ACTIVE") {
    throw new Error("Esta barbearia não está aceitando avaliações.")
  }

  if (booking.review) {
    throw new Error("Esta reserva já foi avaliada.")
  }

  try {
    await prisma.review.create({
      data: {
        barbershopId: booking.barbershopId,
        bookingId,
        userId,
        employeeId,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
      },
    })
  } catch (error) {
    // A double submit can race past the check above; Review.bookingId is unique
    if ((error as { code?: string } | null)?.code === "P2002") {
      throw new Error("Esta reserva já foi avaliada.")
    }
    throw error
  }

  revalidateShop(booking.barbershop)
}
