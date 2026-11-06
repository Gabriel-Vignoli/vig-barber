"use server"

import { prisma } from "../_lib/prisma"
import { getSessionUserId } from "../_lib/tenant"

// The signed-in user's own data, for the LGPD access and portability rights.
// Every query is keyed by the session's user id, across all shops on purpose.
// The select lists are the contract: no password, tokens or internal ids.
export const getMyData = async () => {
  const userId = await getSessionUserId()

  if (!userId) {
    throw new Error("Você precisa estar logado.")
  }

  const [profile, bookings, reviews, memberships, employees, consents] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          phone: true,
          image: true,
          createdAt: true,
          acceptedTermsAt: true,
        },
      }),
      prisma.booking.findMany({
        where: { userId },
        orderBy: { bookingDate: "desc" },
        select: {
          bookingDate: true,
          status: true,
          paymentMethod: true,
          createdAt: true,
          barbershop: { select: { name: true } },
          barbershopService: { select: { name: true, price: true } },
          employee: { select: { user: { select: { name: true } } } },
        },
      }),
      prisma.review.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          rating: true,
          comment: true,
          createdAt: true,
          barbershop: { select: { name: true } },
        },
      }),
      prisma.membership.findMany({
        where: { userId },
        select: {
          role: true,
          createdAt: true,
          barbershop: { select: { name: true } },
        },
      }),
      prisma.employee.findMany({
        where: { userId },
        select: {
          bio: true,
          phone: true,
          imageUrl: true,
          isActive: true,
          barbershop: { select: { name: true } },
        },
      }),
      prisma.consent.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          context: true,
          version: true,
          createdAt: true,
          barbershop: { select: { name: true } },
        },
      }),
    ])

  return {
    exportedAt: new Date().toISOString(),
    profile,
    bookings: bookings.map((booking) => ({
      date: booking.bookingDate,
      status: booking.status,
      paymentMethod: booking.paymentMethod,
      createdAt: booking.createdAt,
      shop: booking.barbershop.name,
      service: booking.barbershopService.name,
      currentServicePrice: Number(booking.barbershopService.price),
      professional: booking.employee.user.name,
    })),
    reviews: reviews.map(({ barbershop, ...review }) => ({
      ...review,
      shop: barbershop.name,
    })),
    memberships: memberships.map(({ barbershop, ...membership }) => ({
      ...membership,
      shop: barbershop.name,
    })),
    staffProfiles: employees.map(({ barbershop, ...employee }) => ({
      ...employee,
      shop: barbershop.name,
    })),
    consents: consents.map(({ barbershop, ...consent }) => ({
      ...consent,
      shop: barbershop?.name ?? null,
    })),
  }
}
