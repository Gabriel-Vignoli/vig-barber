import { beforeEach, describe, expect, it } from "vitest"
import { updateTag } from "next/cache"
import { prisma } from "@/app/_lib/prisma"
import { requireShopRole, shopTag } from "@/app/_lib/tenant"
import {
  getFirstShopWithRole,
  getStaffLandingPath,
} from "@/app/_lib/staff-shop"
import { redirectToShopArea } from "@/app/_lib/redirect-to-shop-area"
import { createEmployee } from "@/app/_actions/create-employee"
import { createAtendente } from "@/app/_actions/create-atendente"
import { deleteEmployee } from "@/app/_actions/delete-employee"
import { deleteAtendente } from "@/app/_actions/delete-atendente"
import { updateEmployee } from "@/app/_actions/update-employee"
import { updateEmployeeSchedule } from "@/app/_actions/update-employee-schedule"
import { createWalkInBooking } from "@/app/_actions/create-walkin-booking"
import {
  getEmployeeConcludedBookings,
  getEmployeeUpcomingBookings,
  getShopEmployeeForUser,
} from "@/app/_data/get-employee-bookings"
import {
  createEmployee as createEmployeeRow,
  createMembership,
  createService,
  createShop,
  createUser,
} from "./helpers/factories"
import { NotFoundError, RedirectError } from "./helpers/navigation"
import { mockSession } from "./helpers/session"
import { failNextEmail, getSentEmails } from "./helpers/email"

// A Monday, far in the future
const FUTURE = new Date("2030-01-07T15:00:00.000Z")
const PAST = new Date("2020-01-06T15:00:00.000Z")
const ORIGINAL_HASH = "hash-original"
const NEW_PASSWORD = "Senha12345!"

type Fixture = Awaited<ReturnType<typeof seedTwoShops>>
let f: Fixture

const withPassword = (userId: string) =>
  prisma.user.update({
    where: { id: userId },
    data: { password: ORIGINAL_HASH },
  })

// Two shops, each with an ADMIN, an ATENDENTE and a service with a barber. A
// barber works in both shops. A client account exists with a password.
const seedTwoShops = async () => {
  const shopA = await createShop({ slug: "barbearia-a" })
  const shopB = await createShop({ slug: "barbearia-b" })

  const adminA = await createUser({ name: "Admin A" })
  const adminB = await createUser({ name: "Admin B" })
  await createMembership(adminA.id, shopA.id, "ADMIN")
  await createMembership(adminB.id, shopB.id, "ADMIN")

  const atendenteA = await createUser({ name: "Atendente A" })
  const atendenteB = await createUser({ name: "Atendente B" })
  await createMembership(atendenteA.id, shopA.id, "ATENDENTE")
  await createMembership(atendenteB.id, shopB.id, "ATENDENTE")

  const serviceA = await createService(shopA.id, { price: 50 })
  const serviceB = await createService(shopB.id, { price: 80 })
  const serviceA2 = await createService(shopA.id, { name: "Barba A" })

  const barberA = await createUser({ name: "Barbeiro A" })
  const employeeA = await createEmployeeRow(barberA.id, shopA.id, [serviceA.id])

  const sharedBarber = await createUser({ name: "Barbeiro Compartilhado" })
  const sharedInA = await createEmployeeRow(sharedBarber.id, shopA.id, [
    serviceA.id,
  ])
  const sharedInB = await createEmployeeRow(sharedBarber.id, shopB.id, [
    serviceB.id,
  ])

  const client = await createUser({
    name: "Cliente Original",
    email: "cliente@test.local",
  })
  await withPassword(client.id)

  return {
    shopA,
    shopB,
    adminA,
    adminB,
    atendenteA,
    atendenteB,
    serviceA,
    serviceA2,
    serviceB,
    barberA,
    employeeA,
    sharedBarber,
    sharedInA,
    sharedInB,
    client,
  }
}

const walkIn = (
  overrides: Partial<Parameters<typeof createWalkInBooking>[1]>,
) => ({
  employeeId: f.employeeA.id,
  barbershopServiceId: f.serviceA.id,
  bookingDate: FUTURE,
  clientName: "Cliente Balcão",
  ...overrides,
})

beforeEach(async () => {
  f = await seedTwoShops()
  mockSession(f.adminA.id)
})

describe("createEmployee with an existing user", () => {
  it("sends an invitation instead of attaching the account", async () => {
    const result = await createEmployee("barbearia-a", {
      name: "Nome Trocado",
      email: "cliente@test.local",
      password: NEW_PASSWORD,
      bio: "Especialista em degradê",
    })

    expect(result).toEqual({ invited: true })

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: f.client.id },
      include: { employees: true, memberships: true },
    })
    expect(user.name).toBe("Cliente Original")
    expect(user.password).toBe(ORIGINAL_HASH)
    expect(user.employees).toEqual([])
    expect(user.memberships).toEqual([])

    const invitations = await prisma.invitation.findMany()
    expect(invitations).toMatchObject([
      {
        email: "cliente@test.local",
        barbershopId: f.shopA.id,
        role: "EMPLOYEE",
        invitedById: f.adminA.id,
        acceptedAt: null,
      },
    ])
    expect(getSentEmails()).toMatchObject([{ to: "cliente@test.local" }])
  })

  it("matches the existing account case-insensitively", async () => {
    const usersBefore = await prisma.user.count()

    const result = await createEmployee("barbearia-a", {
      email: "CLIENTE@Test.local",
    })

    expect(result).toEqual({ invited: true })
    expect(await prisma.user.count()).toBe(usersBefore)
    expect(
      await prisma.invitation.findFirstOrThrow({ select: { email: true } }),
    ).toEqual({ email: "cliente@test.local" })
  })

  it("replaces the pending invitation when invited again", async () => {
    await createEmployee("barbearia-a", { email: "cliente@test.local" })
    const first = await prisma.invitation.findFirstOrThrow()

    await createEmployee("barbearia-a", { email: "cliente@test.local" })

    const invitations = await prisma.invitation.findMany()
    expect(invitations).toHaveLength(1)
    expect(invitations[0].tokenHash).not.toBe(first.tokenHash)
  })

  it("keeps no invitation when the email fails", async () => {
    failNextEmail()

    await expect(
      createEmployee("barbearia-a", { email: "cliente@test.local" }),
    ).rejects.toThrow("Não foi possível enviar o convite. Tente novamente.")
    expect(await prisma.invitation.count()).toBe(0)
  })

  it("rejects an active barber of this shop", async () => {
    const barber = await prisma.user.findUniqueOrThrow({
      where: { id: f.barberA.id },
    })

    await expect(
      createEmployee("barbearia-a", { email: barber.email! }),
    ).rejects.toThrow("Este usuário já é funcionário desta barbearia.")
    expect(await prisma.invitation.count()).toBe(0)
  })

  it("rejects an atendente of this shop", async () => {
    await prisma.user.update({
      where: { id: f.atendenteA.id },
      data: { email: "atendente-a@test.local" },
    })

    await expect(
      createEmployee("barbearia-a", { email: "atendente-a@test.local" }),
    ).rejects.toThrow("Este usuário já é atendente desta barbearia.")
  })

  it("gives an ADMIN who cuts hair an Employee row and keeps the ADMIN role", async () => {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { id: f.adminA.id },
    })

    const result = await createEmployee("barbearia-a", { email: admin.email! })

    expect(result).toEqual({ invited: false })
    const membership = await prisma.membership.findFirstOrThrow({
      where: { userId: f.adminA.id, barbershopId: f.shopA.id },
    })
    expect(membership.role).toBe("ADMIN")
    expect(
      await prisma.employee.count({
        where: { userId: f.adminA.id, barbershopId: f.shopA.id },
      }),
    ).toBe(1)
    expect(await prisma.invitation.count()).toBe(0)
  })

  it("invites a barber removed earlier instead of reactivating them", async () => {
    await prisma.employee.update({
      where: { id: f.employeeA.id },
      data: { isActive: false },
    })
    await prisma.membership.deleteMany({ where: { userId: f.barberA.id } })
    const barber = await prisma.user.findUniqueOrThrow({
      where: { id: f.barberA.id },
    })

    const result = await createEmployee("barbearia-a", {
      email: barber.email!,
    })

    expect(result).toEqual({ invited: true })
    const employee = await prisma.employee.findUniqueOrThrow({
      where: { id: f.employeeA.id },
    })
    expect(employee.isActive).toBe(false)
  })

  it("creates a brand-new user directly", async () => {
    const result = await createEmployee("barbearia-a", {
      name: "Novo Barbeiro",
      email: "novo@test.local",
      password: NEW_PASSWORD,
    })

    expect(result).toEqual({ invited: false })
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "novo@test.local" },
      include: { employees: true, memberships: true },
    })
    expect(user.employees).toMatchObject([{ barbershopId: f.shopA.id }])
    expect(user.memberships).toMatchObject([
      { barbershopId: f.shopA.id, role: "EMPLOYEE" },
    ])
    expect(await prisma.invitation.count()).toBe(0)
  })

  it("requires name and password for a brand-new user", async () => {
    await expect(
      createEmployee("barbearia-a", { email: "novo@test.local" }),
    ).rejects.toThrow("Informe nome e senha para criar um novo usuário.")
    expect(
      await prisma.user.count({ where: { email: "novo@test.local" } }),
    ).toBe(0)
  })

  it("cannot invite into another shop", async () => {
    await expect(
      createEmployee("barbearia-b", { email: "cliente@test.local" }),
    ).rejects.toThrow("Sem permissão.")
    expect(await prisma.invitation.count()).toBe(0)
  })
})

describe("createAtendente with an existing user", () => {
  it("sends an invitation instead of attaching the account", async () => {
    const result = await createAtendente("barbearia-a", {
      name: "Nome Trocado",
      email: "cliente@test.local",
      password: NEW_PASSWORD,
    })

    expect(result).toEqual({ invited: true })

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: f.client.id },
      include: { memberships: true },
    })
    expect(user.name).toBe("Cliente Original")
    expect(user.password).toBe(ORIGINAL_HASH)
    expect(user.memberships).toEqual([])
    expect(await prisma.invitation.findMany()).toMatchObject([
      {
        email: "cliente@test.local",
        barbershopId: f.shopA.id,
        role: "ATENDENTE",
      },
    ])
  })

  it("rejects an atendente of this shop", async () => {
    const atendente = await prisma.user.findUniqueOrThrow({
      where: { id: f.atendenteA.id },
    })

    await expect(
      createAtendente("barbearia-a", { email: atendente.email! }),
    ).rejects.toThrow("Este usuário já é atendente desta barbearia.")
  })

  it("rejects a user who already has another role in this shop", async () => {
    const barber = await prisma.user.findUniqueOrThrow({
      where: { id: f.barberA.id },
    })

    await expect(
      createAtendente("barbearia-a", { email: barber.email! }),
    ).rejects.toThrow("Este usuário já faz parte da equipe desta barbearia.")
  })
})

describe("updateEmployee and the global account", () => {
  it("never changes the barber account password or name", async () => {
    // The client works as a barber in shop A (e.g. accepted an invitation)...
    const employee = await createEmployeeRow(f.client.id, f.shopA.id)

    // ...and the shop admin tries to set a password (a tampered client can)
    await updateEmployee("barbearia-a", employee.id, {
      bio: "Bio nova",
      // @ts-expect-error the action no longer accepts a password
      password: NEW_PASSWORD,
      name: "Nome Trocado",
    })

    const [user, employeeAfter] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: f.client.id } }),
      prisma.employee.findUniqueOrThrow({ where: { id: employee.id } }),
    ])
    expect(user.password).toBe(ORIGINAL_HASH)
    expect(user.name).toBe("Cliente Original")
    expect(employeeAfter.bio).toBe("Bio nova")
  })

  it("does not update an employee of another shop", async () => {
    await expect(
      updateEmployee("barbearia-a", f.sharedInB.id, { bio: "Bio nova" }),
    ).rejects.toThrow("Funcionário não encontrado.")

    const employee = await prisma.employee.findUniqueOrThrow({
      where: { id: f.sharedInB.id },
    })
    expect(employee.bio).toBeNull()
  })
})

describe("deleteEmployee", () => {
  it("deactivates a barber with bookings and removes the membership", async () => {
    const booking = await prisma.booking.create({
      data: {
        barbershopId: f.shopA.id,
        barbershopServiceId: f.serviceA.id,
        employeeId: f.employeeA.id,
        userId: f.client.id,
        bookingDate: PAST,
      },
    })

    await deleteEmployee("barbearia-a", f.employeeA.id)

    const [employee, membershipCount, userCount, bookingAfter] =
      await Promise.all([
        prisma.employee.findUniqueOrThrow({ where: { id: f.employeeA.id } }),
        prisma.membership.count({ where: { userId: f.barberA.id } }),
        prisma.user.count({ where: { id: f.barberA.id } }),
        prisma.booking.findUniqueOrThrow({ where: { id: booking.id } }),
      ])
    expect(employee.isActive).toBe(false)
    expect(membershipCount).toBe(0)
    expect(userCount).toBe(1)
    expect(bookingAfter.employeeId).toBe(f.employeeA.id)
  })

  it("deletes a barber without history", async () => {
    await deleteEmployee("barbearia-a", f.employeeA.id)

    expect(await prisma.employee.count({ where: { id: f.employeeA.id } })).toBe(
      0,
    )
    expect(await prisma.user.count({ where: { id: f.barberA.id } })).toBe(1)
  })

  it("treats an already removed barber as not found", async () => {
    await prisma.employee.update({
      where: { id: f.employeeA.id },
      data: { isActive: false },
    })

    await expect(deleteEmployee("barbearia-a", f.employeeA.id)).rejects.toThrow(
      "Funcionário não encontrado.",
    )
  })
})

describe("deleteAtendente", () => {
  it("also removes the atendente's Employee row in this shop", async () => {
    const employee = await prisma.employee.create({
      data: { userId: f.atendenteA.id, barbershopId: f.shopA.id },
    })

    await deleteAtendente("barbearia-a", f.atendenteA.id)

    expect(await prisma.employee.count({ where: { id: employee.id } })).toBe(0)
    expect(
      await prisma.membership.count({ where: { userId: f.atendenteA.id } }),
    ).toBe(0)
    expect(await prisma.user.count({ where: { id: f.atendenteA.id } })).toBe(1)
  })
})

describe("updateEmployeeSchedule validation", () => {
  const valid = {
    weekday: "MONDAY" as const,
    startTime: "09:00",
    endTime: "18:00",
    isDayOff: false,
  }

  it.each([
    [{ ...valid, startTime: "9h" }, "Horário inválido. Use o formato HH:mm."],
    [{ ...valid, endTime: "24:00" }, "Horário inválido. Use o formato HH:mm."],
    [
      { ...valid, startTime: "18:00", endTime: "09:00" },
      "O horário de início deve ser antes do horário de término.",
    ],
    [
      { ...valid, startTime: "10:00", endTime: "10:00" },
      "O horário de início deve ser antes do horário de término.",
    ],
  ])("rejects %o", async (entry, message) => {
    await expect(
      updateEmployeeSchedule("barbearia-a", f.employeeA.id, [entry]),
    ).rejects.toThrow(message)
    expect(
      await prisma.employeeSchedule.count({
        where: { employeeId: f.employeeA.id },
      }),
    ).toBe(0)
  })

  it("rejects the same weekday twice", async () => {
    await expect(
      updateEmployeeSchedule("barbearia-a", f.employeeA.id, [valid, valid]),
    ).rejects.toThrow("Cada dia da semana só pode aparecer uma vez.")
  })

  it("rejects an unknown weekday", async () => {
    await expect(
      updateEmployeeSchedule("barbearia-a", f.employeeA.id, [
        // @ts-expect-error invalid on purpose
        { ...valid, weekday: "FUNDAY" },
      ]),
    ).rejects.toThrow("Dia da semana inválido.")
  })

  it("accepts a day off with any times and a valid week", async () => {
    await updateEmployeeSchedule("barbearia-a", f.employeeA.id, [
      valid,
      {
        weekday: "SUNDAY",
        startTime: "00:00",
        endTime: "00:00",
        isDayOff: true,
      },
    ])

    expect(
      await prisma.employeeSchedule.count({
        where: { employeeId: f.employeeA.id },
      }),
    ).toBe(2)
  })
})

describe("createWalkInBooking", () => {
  beforeEach(() => {
    mockSession(f.atendenteA.id)
  })

  it("creates the booking in the atendente's shop", async () => {
    await createWalkInBooking("barbearia-a", walkIn({}))

    const booking = await prisma.booking.findFirstOrThrow({
      where: { employeeId: f.employeeA.id },
    })
    expect(booking.barbershopId).toBe(f.shopA.id)
    expect(updateTag).toHaveBeenCalledWith(shopTag(f.shopA.id))
  })

  it("lets the shop ADMIN use the front desk too", async () => {
    mockSession(f.adminA.id)

    await createWalkInBooking("barbearia-a", walkIn({}))

    expect(await prisma.booking.count()).toBe(1)
  })

  it.each([
    [
      "a service of another shop",
      () => walkIn({ barbershopServiceId: f.serviceB.id }),
    ],
    [
      "an employee of another shop",
      () => walkIn({ employeeId: f.sharedInB.id }),
    ],
    [
      "a service the employee does not offer",
      () => walkIn({ barbershopServiceId: f.serviceA2.id }),
    ],
  ])("rejects %s", async (_, input) => {
    await expect(createWalkInBooking("barbearia-a", input())).rejects.toThrow(
      "Serviço ou profissional indisponível nesta barbearia.",
    )
    expect(await prisma.booking.count()).toBe(0)
    expect(await prisma.user.count({ where: { name: "Cliente Balcão" } })).toBe(
      0,
    )
  })

  it("rejects an inactive employee", async () => {
    await prisma.employee.update({
      where: { id: f.employeeA.id },
      data: { isActive: false },
    })

    await expect(
      createWalkInBooking("barbearia-a", walkIn({})),
    ).rejects.toThrow("Serviço ou profissional indisponível nesta barbearia.")
  })

  it("rejects a foreign slug", async () => {
    await expect(
      createWalkInBooking(
        "barbearia-b",
        walkIn({
          employeeId: f.sharedInB.id,
          barbershopServiceId: f.serviceB.id,
        }),
      ),
    ).rejects.toThrow("Sem permissão.")
    expect(await prisma.booking.count()).toBe(0)
  })

  it("rejects a non-member and a barber", async () => {
    mockSession(f.client.id)
    await expect(
      createWalkInBooking("barbearia-a", walkIn({})),
    ).rejects.toThrow("Sem permissão.")

    mockSession(f.barberA.id)
    await expect(
      createWalkInBooking("barbearia-a", walkIn({})),
    ).rejects.toThrow("Sem permissão.")
    expect(await prisma.booking.count()).toBe(0)
  })

  it("rejects a suspended shop", async () => {
    await prisma.barbershop.update({
      where: { id: f.shopA.id },
      data: { status: "SUSPENDED" },
    })

    await expect(
      createWalkInBooking("barbearia-a", walkIn({})),
    ).rejects.toThrow("Barbearia não encontrada.")
  })
})

describe("atendente and staff access", () => {
  it("gives an atendente of a suspended shop no shop at all", async () => {
    await prisma.barbershop.update({
      where: { id: f.shopA.id },
      data: { status: "SUSPENDED" },
    })
    mockSession(f.atendenteA.id)

    expect(
      await getFirstShopWithRole(f.atendenteA.id, ["ATENDENTE", "ADMIN"]),
    ).toBeNull()
    expect(await getStaffLandingPath(f.atendenteA.id)).toBeNull()
    await expect(
      requireShopRole("barbearia-a", ["ATENDENTE", "ADMIN"]),
    ).rejects.toBeInstanceOf(NotFoundError)
    // The legacy /admin/atendente URL no longer falls back to another shop
    await expect(
      redirectToShopArea({ area: "atendente", roles: ["ATENDENTE", "ADMIN"] }),
    ).rejects.toMatchObject({ url: "/" })
  })

  it("sends a non-member away from the atendente area", async () => {
    mockSession(f.client.id)

    await expect(
      requireShopRole("barbearia-a", ["ATENDENTE", "ADMIN"]),
    ).rejects.toMatchObject({ url: "/b/barbearia-a" })
    await expect(
      redirectToShopArea({ area: "atendente", roles: ["ATENDENTE", "ADMIN"] }),
    ).rejects.toMatchObject({ url: "/" })
  })

  it("lands each staff role in its own area of its shop", async () => {
    expect(await getStaffLandingPath(f.adminA.id)).toBe("/b/barbearia-a/admin")
    expect(await getStaffLandingPath(f.atendenteA.id)).toBe(
      "/b/barbearia-a/atendente",
    )
    expect(await getStaffLandingPath(f.barberA.id)).toBe("/b/barbearia-a/staff")
    expect(await getStaffLandingPath(f.client.id)).toBeNull()
  })

  it("redirects the legacy atendente bookings URL with its query", async () => {
    mockSession(f.atendenteB.id)

    const error = await redirectToShopArea({
      area: "atendente",
      roles: ["ATENDENTE", "ADMIN"],
      section: "bookings",
      searchParams: { filter: "past", page: "2" },
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(RedirectError)
    expect((error as RedirectError).url).toBe(
      "/b/barbearia-b/atendente/bookings?filter=past&page=2",
    )
  })
})

describe("staff dashboard fetchers", () => {
  it("return only the bookings of that shop", async () => {
    const bookingInA = await prisma.booking.create({
      data: {
        barbershopId: f.shopA.id,
        barbershopServiceId: f.serviceA.id,
        employeeId: f.sharedInA.id,
        userId: f.client.id,
        bookingDate: FUTURE,
      },
    })
    const pastInA = await prisma.booking.create({
      data: {
        barbershopId: f.shopA.id,
        barbershopServiceId: f.serviceA.id,
        employeeId: f.sharedInA.id,
        userId: f.client.id,
        bookingDate: PAST,
      },
    })
    for (const bookingDate of [FUTURE, PAST]) {
      await prisma.booking.create({
        data: {
          barbershopId: f.shopB.id,
          barbershopServiceId: f.serviceB.id,
          employeeId: f.sharedInB.id,
          userId: f.client.id,
          bookingDate,
        },
      })
    }

    const employee = await getShopEmployeeForUser(f.shopA.id, f.sharedBarber.id)
    expect(employee?.id).toBe(f.sharedInA.id)

    const [upcoming, concluded] = await Promise.all([
      getEmployeeUpcomingBookings(f.shopA.id, f.sharedInA.id),
      getEmployeeConcludedBookings(f.shopA.id, f.sharedInA.id),
    ])
    expect(upcoming.map((booking) => booking.id)).toEqual([bookingInA.id])
    expect(concluded.map((booking) => booking.id)).toEqual([pastInA.id])

    // Another shop's employee id under this shop returns nothing
    expect(
      await getEmployeeUpcomingBookings(f.shopA.id, f.sharedInB.id),
    ).toEqual([])
  })

  it("has no employee for a user who is not a barber of that shop", async () => {
    expect(await getShopEmployeeForUser(f.shopA.id, f.client.id)).toBeNull()

    await prisma.employee.update({
      where: { id: f.employeeA.id },
      data: { isActive: false },
    })
    expect(await getShopEmployeeForUser(f.shopA.id, f.barberA.id)).toBeNull()
  })
})
