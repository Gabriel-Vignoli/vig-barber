import { beforeEach, describe, expect, it } from "vitest"
import { updateTag } from "next/cache"
import { prisma } from "@/app/_lib/prisma"
import { shopTag } from "@/app/_lib/tenant"
import { deleteBooking } from "@/app/_actions/delete-booking"
import { createReview } from "@/app/_actions/create-review"
import { updateReview } from "@/app/_actions/update-review"
import { deleteReview } from "@/app/_actions/delete-review"
import { updateProfile } from "@/app/_actions/update-profile"
import { updatePhone } from "@/app/_actions/update-phone"
import { updatePassword } from "@/app/_actions/update-password"
import {
  createEmployee,
  createService,
  createShop,
  createUser,
} from "./helpers/factories"
import { mockSession } from "./helpers/session"

// Actions a client runs on their own records. None of them takes a slug: the
// shop always comes from the booking or review row, never from the client.

const PAST = new Date("2020-01-06T15:00:00.000Z")
const FUTURE = new Date("2030-01-07T15:00:00.000Z")

type Fixture = Awaited<ReturnType<typeof seed>>
let f: Fixture

// Two shops with one barber each. The client has a past booking in each shop
// and a review on the shop A one; a second client has a past booking in shop B.
const seed = async () => {
  const shopA = await createShop({ slug: "barbearia-a" })
  const shopB = await createShop({ slug: "barbearia-b" })

  const serviceA = await createService(shopA.id)
  const serviceB = await createService(shopB.id)

  const barberA = await createUser({ name: "Barbeiro A" })
  const barberB = await createUser({ name: "Barbeiro B" })
  const employeeA = await createEmployee(barberA.id, shopA.id, [serviceA.id])
  const employeeB = await createEmployee(barberB.id, shopB.id, [serviceB.id])

  const client = await createUser({ name: "Cliente" })
  const otherClient = await createUser({ name: "Outro Cliente" })

  const booking = (
    barbershopId: string,
    barbershopServiceId: string,
    employeeId: string,
    userId: string,
    bookingDate = PAST,
  ) =>
    prisma.booking.create({
      data: {
        barbershopId,
        barbershopServiceId,
        employeeId,
        userId,
        bookingDate,
      },
    })

  const bookingA = await booking(shopA.id, serviceA.id, employeeA.id, client.id)
  const bookingB = await booking(shopB.id, serviceB.id, employeeB.id, client.id)
  const otherBookingB = await booking(
    shopB.id,
    serviceB.id,
    employeeB.id,
    otherClient.id,
  )

  const reviewA = await prisma.review.create({
    data: {
      barbershopId: shopA.id,
      bookingId: bookingA.id,
      userId: client.id,
      employeeId: employeeA.id,
      rating: 4,
      comment: "Bom",
    },
  })

  return {
    shopA,
    shopB,
    serviceA,
    serviceB,
    employeeA,
    employeeB,
    client,
    otherClient,
    bookingA,
    bookingB,
    otherBookingB,
    reviewA,
    booking,
  }
}

beforeEach(async () => {
  f = await seed()
})

describe("deleteBooking", () => {
  it("cancels the client's own booking and revalidates its shop", async () => {
    mockSession(f.client.id)

    await deleteBooking(f.bookingB.id)

    const cancelled = await prisma.booking.findUniqueOrThrow({
      where: { id: f.bookingB.id },
    })
    expect(cancelled.status).toBe("CANCELLED")
    expect(updateTag).toHaveBeenCalledWith(shopTag(f.shopB.id))
  })

  it("does not cancel another client's booking", async () => {
    mockSession(f.client.id)

    await expect(deleteBooking(f.otherBookingB.id)).rejects.toThrow(
      "Reserva não encontrada.",
    )

    const untouched = await prisma.booking.findUniqueOrThrow({
      where: { id: f.otherBookingB.id },
    })
    expect(untouched.status).toBe("PENDING")
    expect(updateTag).not.toHaveBeenCalled()
  })

  it("rejects a signed-out visitor", async () => {
    await expect(deleteBooking(f.bookingA.id)).rejects.toThrow(
      "Usuário não autenticado",
    )
  })
})

describe("createReview", () => {
  it("puts the review in the booking's shop", async () => {
    mockSession(f.client.id)

    await createReview({
      bookingId: f.bookingB.id,
      employeeId: f.employeeB.id,
      rating: 5,
    })

    const review = await prisma.review.findUniqueOrThrow({
      where: { bookingId: f.bookingB.id },
    })
    expect(review).toMatchObject({
      barbershopId: f.shopB.id,
      employeeId: f.employeeB.id,
      userId: f.client.id,
    })
    expect(updateTag).toHaveBeenCalledWith(shopTag(f.shopB.id))
  })

  it("rejects another client's booking", async () => {
    mockSession(f.client.id)

    await expect(
      createReview({
        bookingId: f.otherBookingB.id,
        employeeId: f.employeeB.id,
        rating: 1,
      }),
    ).rejects.toThrow("Reserva inválida para avaliação.")
    expect(await prisma.review.count()).toBe(1)
  })

  it("rejects an employee of another shop than the booking", async () => {
    mockSession(f.client.id)

    await expect(
      createReview({
        bookingId: f.bookingB.id,
        employeeId: f.employeeA.id,
        rating: 1,
      }),
    ).rejects.toThrow("Reserva inválida para avaliação.")
    expect(await prisma.review.count()).toBe(1)
  })

  it("rejects a cancelled or a future booking", async () => {
    mockSession(f.client.id)
    await prisma.booking.update({
      where: { id: f.bookingB.id },
      data: { status: "CANCELLED" },
    })
    const future = await f.booking(
      f.shopB.id,
      f.serviceB.id,
      f.employeeB.id,
      f.client.id,
      FUTURE,
    )

    for (const bookingId of [f.bookingB.id, future.id]) {
      await expect(
        createReview({ bookingId, employeeId: f.employeeB.id, rating: 5 }),
      ).rejects.toThrow("Reserva inválida para avaliação.")
    }
    expect(await prisma.review.count()).toBe(1)
  })

  it("rejects a signed-out visitor", async () => {
    await expect(
      createReview({
        bookingId: f.bookingB.id,
        employeeId: f.employeeB.id,
        rating: 5,
      }),
    ).rejects.toThrow("Usuário não autenticado")
  })
})

describe("updateReview and deleteReview", () => {
  it("let the author edit and remove their review", async () => {
    mockSession(f.client.id)

    await updateReview({ reviewId: f.reviewA.id, rating: 2, comment: "Mudei" })
    expect(
      await prisma.review.findUniqueOrThrow({ where: { id: f.reviewA.id } }),
    ).toMatchObject({ rating: 2, comment: "Mudei" })

    await deleteReview(f.reviewA.id)
    expect(await prisma.review.count({ where: { id: f.reviewA.id } })).toBe(0)
    expect(updateTag).toHaveBeenCalledWith(shopTag(f.shopA.id))
  })

  it("do not touch someone else's review", async () => {
    mockSession(f.otherClient.id)

    await expect(
      updateReview({ reviewId: f.reviewA.id, rating: 1, comment: "Invadido" }),
    ).rejects.toThrow("Avaliação não encontrada.")
    await expect(deleteReview(f.reviewA.id)).rejects.toThrow(
      "Avaliação não encontrada.",
    )

    expect(
      await prisma.review.findUniqueOrThrow({ where: { id: f.reviewA.id } }),
    ).toMatchObject({ rating: 4, comment: "Bom" })
  })

  it("reject a signed-out visitor", async () => {
    await expect(
      updateReview({ reviewId: f.reviewA.id, rating: 1 }),
    ).rejects.toThrow("Usuário não autenticado")
    await expect(deleteReview(f.reviewA.id)).rejects.toThrow(
      "Usuário não autenticado",
    )
  })
})

describe("profile actions", () => {
  it("only ever change the signed-in user", async () => {
    mockSession(f.client.id)
    const before = await prisma.user.findUniqueOrThrow({
      where: { id: f.otherClient.id },
    })

    await updateProfile({ name: "Cliente Renomeado" })
    await updatePhone({ phone: "11999990000" })
    await updatePassword({
      newPassword: "NovaSenha123!",
      confirmNewPassword: "NovaSenha123!",
    })

    const client = await prisma.user.findUniqueOrThrow({
      where: { id: f.client.id },
    })
    expect(client).toMatchObject({
      name: "Cliente Renomeado",
      phone: "11999990000",
    })
    expect(client.password).toBeTruthy()
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: f.otherClient.id } }),
    ).toEqual(before)
  })

  it("reject a signed-out visitor", async () => {
    await expect(updateProfile({ name: "Ninguém" })).rejects.toThrow(
      "Usuário não autenticado",
    )
    await expect(updatePhone({ phone: "11999990000" })).rejects.toThrow(
      "Usuário não autenticado",
    )
    await expect(
      updatePassword({
        newPassword: "NovaSenha123!",
        confirmNewPassword: "NovaSenha123!",
      }),
    ).rejects.toThrow("Usuário não autenticado")
  })
})
