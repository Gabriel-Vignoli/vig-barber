import { beforeEach, describe, expect, it } from "vitest"
import { updateTag } from "next/cache"
import { prisma } from "@/app/_lib/prisma"
import { shopTag } from "@/app/_lib/tenant"
import { deleteAccount } from "@/app/_actions/delete-account"
import { getMyData } from "@/app/_actions/get-my-data"
import { unwrap } from "@/app/_lib/action-result"
import {
  createEmployee,
  createMembership,
  createService,
  createShop,
  createUser,
} from "./helpers/factories"
import { mockSession } from "./helpers/session"

const PAST = new Date("2020-01-06T15:00:00.000Z")
const FUTURE = new Date("2030-01-07T15:00:00.000Z")
const EMAIL = "cliente@test.local"

type Fixture = Awaited<ReturnType<typeof seed>>
let f: Fixture

const seed = async () => {
  const shopA = await createShop({ slug: "barbearia-a" })
  const shopB = await createShop({ slug: "barbearia-b" })
  const serviceA = await createService(shopA.id)
  const serviceB = await createService(shopB.id)
  const barberA = await createUser({ name: "Barbeiro A" })
  const barberB = await createUser({ name: "Barbeiro B" })
  const employeeA = await createEmployee(barberA.id, shopA.id, [serviceA.id])
  const employeeB = await createEmployee(barberB.id, shopB.id, [serviceB.id])
  const client = await createUser({ name: "Cliente", email: EMAIL })
  const other = await createUser({ name: "Outro", email: "outro@test.local" })

  const book = (userId: string, bookingDate: Date, shop: "A" | "B" = "A") =>
    prisma.booking.create({
      data: {
        userId,
        bookingDate,
        barbershopId: shop === "A" ? shopA.id : shopB.id,
        barbershopServiceId: shop === "A" ? serviceA.id : serviceB.id,
        employeeId: shop === "A" ? employeeA.id : employeeB.id,
      },
    })

  return {
    shopA,
    shopB,
    serviceA,
    barberA,
    barberB,
    employeeA,
    client,
    other,
    book,
  }
}

const statusOf = async (id: string) =>
  (await prisma.booking.findUniqueOrThrow({ where: { id } })).status

beforeEach(async () => {
  f = await seed()
  mockSession(f.client.id)
})

describe("deleteAccount", () => {
  it("anonymizes the user and clears what identifies them", async () => {
    await prisma.user.update({
      where: { id: f.client.id },
      data: {
        phone: "11912345678",
        password: "hash",
        image: "https://utfs.io/f/a.png",
        emailVerified: new Date(),
      },
    })
    await prisma.account.create({
      data: {
        userId: f.client.id,
        type: "oauth",
        provider: "google",
        providerAccountId: "google-1",
        access_token: "token",
      },
    })
    await prisma.passwordResetCode.create({
      data: { email: EMAIL, code: "123456", expiresAt: FUTURE },
    })
    await prisma.account.create({
      data: {
        userId: f.other.id,
        type: "oauth",
        provider: "google",
        providerAccountId: "google-2",
      },
    })
    await prisma.passwordResetCode.create({
      data: { email: "outro@test.local", code: "654321", expiresAt: FUTURE },
    })
    const invitation = (email: string, tokenHash: string, accepted: boolean) =>
      prisma.invitation.create({
        data: {
          email,
          tokenHash,
          barbershopId: f.shopB.id,
          role: "EMPLOYEE",
          expiresAt: FUTURE,
          acceptedAt: accepted ? new Date() : null,
        },
      })
    await invitation("Cliente@Test.local", "hash-accepted", true)
    await invitation("outro@test.local", "hash-other", true)

    await unwrap(deleteAccount(EMAIL.toUpperCase()))

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: f.client.id },
    })
    expect(user).toMatchObject({
      name: "Usuário anônimo",
      email: null,
      emailVerified: null,
      image: null,
      phone: null,
      password: null,
    })
    expect(user.deletedAt).not.toBeNull()
    expect(await prisma.account.findMany()).toMatchObject([
      { userId: f.other.id },
    ])
    expect(await prisma.passwordResetCode.findMany()).toMatchObject([
      { email: "outro@test.local" },
    ])
    expect(await prisma.invitation.findMany()).toMatchObject([
      { tokenHash: "hash-other" },
    ])
  })

  it("leaves pending invitations alone, since the email is unverified", async () => {
    // Anyone can register an invited address: this must not cancel the invite
    await prisma.invitation.create({
      data: {
        email: EMAIL,
        barbershopId: f.shopA.id,
        role: "ADMIN",
        tokenHash: "hash-pending",
        expiresAt: FUTURE,
      },
    })

    await unwrap(deleteAccount(EMAIL))

    expect(await prisma.invitation.count()).toBe(1)
  })

  it("lets the same email open a new account afterwards", async () => {
    await unwrap(deleteAccount(EMAIL))

    await expect(createUser({ email: EMAIL })).resolves.toBeTruthy()
  })

  it("cancels future bookings and keeps history, reviews and consents", async () => {
    const past = await f.book(f.client.id, PAST)
    const future = await f.book(f.client.id, FUTURE)
    const futureB = await f.book(f.client.id, FUTURE, "B")
    const someoneElse = await f.book(f.other.id, FUTURE)
    const review = await prisma.review.create({
      data: {
        barbershopId: f.shopA.id,
        bookingId: past.id,
        userId: f.client.id,
        employeeId: f.employeeA.id,
        rating: 5,
        comment: "Ótimo",
      },
    })
    await prisma.consent.create({
      data: { userId: f.client.id, context: "SIGN_UP", version: "v1" },
    })

    await unwrap(deleteAccount(EMAIL))

    expect(await statusOf(past.id)).toBe("PENDING")
    expect(await statusOf(future.id)).toBe("CANCELLED")
    expect(await statusOf(futureB.id)).toBe("CANCELLED")
    expect(await statusOf(someoneElse.id)).toBe("PENDING")
    expect(
      await prisma.review.findUniqueOrThrow({ where: { id: review.id } }),
    ).toMatchObject({ rating: 5, comment: "Ótimo", userId: f.client.id })
    expect(await prisma.consent.count({ where: { userId: f.client.id } })).toBe(
      1,
    )
    expect(updateTag).toHaveBeenCalledWith(shopTag(f.shopA.id))
    expect(updateTag).toHaveBeenCalledWith(shopTag(f.shopB.id))
  })

  it("takes a barber out of the shop and wipes the kept Employee row", async () => {
    await prisma.user.update({
      where: { id: f.barberA.id },
      data: { email: "barbeiro@test.local" },
    })
    await prisma.employee.update({
      where: { id: f.employeeA.id },
      data: { phone: "11912345678", bio: "Bio", imageUrl: "https://a.b/c.png" },
    })
    await f.book(f.client.id, PAST)
    mockSession(f.barberA.id)

    await unwrap(deleteAccount("barbeiro@test.local"))

    expect(
      await prisma.membership.count({ where: { userId: f.barberA.id } }),
    ).toBe(0)
    expect(
      await prisma.membership.count({ where: { userId: f.barberB.id } }),
    ).toBe(1)
    expect(
      await prisma.employee.findFirstOrThrow({
        where: { userId: f.barberB.id },
      }),
    ).toMatchObject({ isActive: true })
    expect(
      await prisma.employee.findUniqueOrThrow({
        where: { id: f.employeeA.id },
      }),
    ).toMatchObject({ isActive: false, phone: null, bio: null, imageUrl: null })
  })

  it("refuses a barber with upcoming appointments", async () => {
    await prisma.user.update({
      where: { id: f.barberA.id },
      data: { email: "barbeiro@test.local" },
    })
    await f.book(f.client.id, FUTURE)
    mockSession(f.barberA.id)

    await expect(unwrap(deleteAccount("barbeiro@test.local"))).rejects.toThrow(
      "Você tem atendimentos agendados como profissional.",
    )

    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: f.barberA.id } }),
    ).toMatchObject({ deletedAt: null, email: "barbeiro@test.local" })
  })

  it("does not stop a barber already out of the shop", async () => {
    await prisma.user.update({
      where: { id: f.barberA.id },
      data: { email: "barbeiro@test.local" },
    })
    await f.book(f.client.id, FUTURE)
    await prisma.employee.update({
      where: { id: f.employeeA.id },
      data: { isActive: false },
    })
    mockSession(f.barberA.id)

    await unwrap(deleteAccount("barbeiro@test.local"))

    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: f.barberA.id } }),
    ).toMatchObject({ email: null })
  })

  it("refuses the only admin of a shop, not one of two", async () => {
    await createMembership(f.client.id, f.shopA.id, "ADMIN")

    await expect(unwrap(deleteAccount(EMAIL))).rejects.toThrow(
      "Você é o único administrador de",
    )
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: f.client.id } }),
    ).toMatchObject({ deletedAt: null })

    await createMembership(f.other.id, f.shopA.id, "ADMIN")
    await unwrap(deleteAccount(EMAIL))

    expect(
      await prisma.membership.findMany({ where: { role: "ADMIN" } }),
    ).toMatchObject([{ userId: f.other.id, role: "ADMIN" }])
  })

  it("refuses a platform admin", async () => {
    const admin = await createUser({
      email: "root@test.local",
      isPlatformAdmin: true,
    })
    mockSession(admin.id)

    await expect(unwrap(deleteAccount("root@test.local"))).rejects.toThrow(
      "Contas de administrador da plataforma",
    )
  })

  it("requires the session owner's own email", async () => {
    await expect(unwrap(deleteAccount("outro@test.local"))).rejects.toThrow(
      "O email digitado não confere.",
    )

    const users = await prisma.user.findMany({
      where: { id: { in: [f.client.id, f.other.id] } },
    })
    expect(users.every((user) => user.deletedAt === null)).toBe(true)
  })

  it("rejects a signed-out visitor", async () => {
    mockSession(null)

    await expect(unwrap(deleteAccount(EMAIL))).rejects.toThrow(
      "Você precisa estar logado.",
    )
  })

  it("does nothing on a second submit", async () => {
    await unwrap(deleteAccount(EMAIL))

    await expect(unwrap(deleteAccount(EMAIL))).rejects.toThrow(
      "Conta não encontrada.",
    )
  })
})

describe("getMyData", () => {
  it("returns the user's data across shops and nobody else's", async () => {
    await prisma.user.update({
      where: { id: f.client.id },
      data: { password: "hash-secreto" },
    })
    await f.book(f.client.id, PAST)
    await f.book(f.client.id, FUTURE, "B")
    await f.book(f.other.id, PAST)
    await prisma.consent.create({
      data: {
        userId: f.client.id,
        barbershopId: f.shopB.id,
        context: "CHECKOUT",
        version: "v1",
      },
    })
    await prisma.consent.create({
      data: { userId: f.other.id, context: "SIGN_UP", version: "v1" },
    })

    const data = await getMyData()

    expect(data.profile.email).toBe(EMAIL)
    expect(data.bookings).toHaveLength(2)
    expect(typeof data.bookings[0].currentServicePrice).toBe("number")
    expect(data.consents).toMatchObject([
      { context: "CHECKOUT", shop: f.shopB.name },
    ])

    const json = JSON.stringify(data)
    expect(json).not.toContain("hash-secreto")
    expect(json).not.toContain("password")
    expect(json).not.toContain(f.other.email)
  })

  it("rejects a signed-out visitor", async () => {
    mockSession(null)

    await expect(getMyData()).rejects.toThrow("Você precisa estar logado.")
  })
})
