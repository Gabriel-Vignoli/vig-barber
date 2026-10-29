import { beforeEach, describe, expect, it } from "vitest"
import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/app/_lib/prisma"
import { shopTag } from "@/app/_lib/tenant"
import { getBookings } from "@/app/_actions/get-bookings"
import { getEmployeeSchedule } from "@/app/_actions/get-employee-schedule"
import { getEmployeesForService } from "@/app/_actions/get-employees-for-service"
import { createBooking } from "@/app/_actions/create-booking"
import { replaceBooking } from "@/app/_actions/replace-booking"
import {
  createEmployee,
  createMembership,
  createService,
  createShop,
  createUser,
} from "./helpers/factories"
import { mockSession } from "./helpers/session"

// A Monday, far in the future, at midday (safe from timezone day shifts)
const DAY = new Date("2030-01-07T15:00:00.000Z")
const SLOT = new Date("2030-01-07T16:00:00.000Z")

type Fixture = Awaited<ReturnType<typeof seedTwoShops>>
let f: Fixture

// Two shops, each with one service, one active employee linked to it, a
// Monday schedule and one booking on DAY
const seedTwoShops = async () => {
  const shopA = await createShop({ slug: "barbearia-a" })
  const shopB = await createShop({ slug: "barbearia-b" })

  const serviceA = await createService(shopA.id, { name: "Corte A" })
  const serviceB = await createService(shopB.id, { name: "Corte B" })

  const barberA = await createUser({ name: "Barbeiro A" })
  const barberB = await createUser({ name: "Barbeiro B" })
  const employeeA = await createEmployee(barberA.id, shopA.id, [serviceA.id])
  const employeeB = await createEmployee(barberB.id, shopB.id, [serviceB.id])

  for (const employeeId of [employeeA.id, employeeB.id]) {
    await prisma.employeeSchedule.create({
      data: {
        employeeId,
        weekday: "MONDAY",
        startTime: "09:00",
        endTime: "18:00",
      },
    })
  }

  const client = await createUser({ name: "Cliente" })

  await prisma.booking.create({
    data: {
      barbershopId: shopA.id,
      barbershopServiceId: serviceA.id,
      employeeId: employeeA.id,
      userId: client.id,
      bookingDate: DAY,
    },
  })
  await prisma.booking.create({
    data: {
      barbershopId: shopB.id,
      barbershopServiceId: serviceB.id,
      employeeId: employeeB.id,
      userId: client.id,
      bookingDate: DAY,
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
  }
}

beforeEach(async () => {
  f = await seedTwoShops()
})

describe("getBookings", () => {
  it("returns only this shop's bookings with a minimal select", async () => {
    const bookings = await getBookings("barbearia-a", {
      employeeId: f.employeeA.id,
      date: DAY,
    })

    expect(bookings).toHaveLength(1)
    expect(Object.keys(bookings[0]).sort()).toEqual([
      "barbershopService",
      "bookingDate",
    ])
    expect(bookings[0].barbershopService).toEqual({ durationInMinutes: 30 })
  })

  it("returns nothing for an employee of another shop", async () => {
    const bookings = await getBookings("barbearia-a", {
      employeeId: f.employeeB.id,
      date: DAY,
    })

    expect(bookings).toEqual([])
  })

  it("rejects an unknown or suspended slug", async () => {
    await createShop({ slug: "suspensa", status: "SUSPENDED" })

    await expect(
      getBookings("nao-existe", { employeeId: f.employeeA.id, date: DAY }),
    ).rejects.toThrow("Barbearia não encontrada.")
    await expect(
      getBookings("suspensa", { employeeId: f.employeeA.id, date: DAY }),
    ).rejects.toThrow("Barbearia não encontrada.")
  })
})

describe("getEmployeeSchedule", () => {
  it("returns the schedule of an employee of this shop", async () => {
    const schedule = await getEmployeeSchedule(
      "barbearia-a",
      f.employeeA.id,
      DAY,
    )

    expect(schedule).toEqual({
      startTime: "09:00",
      endTime: "18:00",
      isDayOff: false,
    })
  })

  it("returns null for an employee of another shop", async () => {
    const schedule = await getEmployeeSchedule(
      "barbearia-a",
      f.employeeB.id,
      DAY,
    )

    expect(schedule).toBeNull()
  })

  it("returns null for an inactive employee", async () => {
    await prisma.employee.update({
      where: { id: f.employeeA.id },
      data: { isActive: false },
    })

    const schedule = await getEmployeeSchedule(
      "barbearia-a",
      f.employeeA.id,
      DAY,
    )

    expect(schedule).toBeNull()
  })

  it("rejects an unknown slug", async () => {
    await expect(
      getEmployeeSchedule("nao-existe", f.employeeA.id, DAY),
    ).rejects.toThrow("Barbearia não encontrada.")
  })
})

describe("getEmployeesForService", () => {
  it("lists the active employees of this shop for the service", async () => {
    const employees = await getEmployeesForService("barbearia-a", f.serviceA.id)

    expect(employees.map((employee) => employee.id)).toEqual([f.employeeA.id])
    expect(employees[0]).toEqual({
      id: f.employeeA.id,
      name: "Barbeiro A",
      imageUrl: "/avatar-placeholder.png",
    })
  })

  it("returns nothing for a service of another shop", async () => {
    const employees = await getEmployeesForService("barbearia-a", f.serviceB.id)

    expect(employees).toEqual([])
  })

  it("ignores a cross-shop link and inactive employees", async () => {
    // Bad data: an employee of shop B linked to a service of shop A
    await prisma.employeeService.create({
      data: { employeeId: f.employeeB.id, serviceId: f.serviceA.id },
    })
    await prisma.employee.update({
      where: { id: f.employeeA.id },
      data: { isActive: false },
    })

    const employees = await getEmployeesForService("barbearia-a", f.serviceA.id)

    expect(employees).toEqual([])
  })

  it("rejects an unknown slug", async () => {
    await expect(
      getEmployeesForService("nao-existe", f.serviceA.id),
    ).rejects.toThrow("Barbearia não encontrada.")
  })
})

describe("createBooking", () => {
  const countBookings = () => prisma.booking.count()

  it("creates the booking in the shop from the slug", async () => {
    const user = await createUser()
    mockSession(user.id)

    await createBooking("barbearia-a", {
      barbershopServiceId: f.serviceA.id,
      employeeId: f.employeeA.id,
      bookingDate: SLOT,
    })

    const booking = await prisma.booking.findFirstOrThrow({
      where: { userId: user.id },
    })
    expect(booking.barbershopId).toBe(f.shopA.id)
    expect(updateTag).toHaveBeenCalledWith(shopTag(f.shopA.id))
    expect(revalidatePath).toHaveBeenCalledWith("/bookings")
  })

  it("rejects when signed out", async () => {
    const before = await countBookings()

    await expect(
      createBooking("barbearia-a", {
        barbershopServiceId: f.serviceA.id,
        employeeId: f.employeeA.id,
        bookingDate: SLOT,
      }),
    ).rejects.toThrow("Usuário não autenticado")
    expect(await countBookings()).toBe(before)
  })

  it("rejects an unknown slug", async () => {
    mockSession((await createUser()).id)

    await expect(
      createBooking("nao-existe", {
        barbershopServiceId: f.serviceA.id,
        employeeId: f.employeeA.id,
        bookingDate: SLOT,
      }),
    ).rejects.toThrow("Barbearia não encontrada.")
  })

  it("rejects a service from another shop", async () => {
    mockSession((await createUser()).id)
    const before = await countBookings()

    await expect(
      createBooking("barbearia-a", {
        barbershopServiceId: f.serviceB.id,
        employeeId: f.employeeA.id,
        bookingDate: SLOT,
      }),
    ).rejects.toThrow("Serviço ou profissional indisponível nesta barbearia.")
    expect(await countBookings()).toBe(before)
  })

  it("rejects an employee from another shop", async () => {
    mockSession((await createUser()).id)
    const before = await countBookings()

    await expect(
      createBooking("barbearia-a", {
        barbershopServiceId: f.serviceA.id,
        employeeId: f.employeeB.id,
        bookingDate: SLOT,
      }),
    ).rejects.toThrow("Serviço ou profissional indisponível nesta barbearia.")
    expect(await countBookings()).toBe(before)
  })

  it("rejects a booking whose whole pair belongs to another shop", async () => {
    mockSession((await createUser()).id)
    const before = await countBookings()

    await expect(
      createBooking("barbearia-a", {
        barbershopServiceId: f.serviceB.id,
        employeeId: f.employeeB.id,
        bookingDate: SLOT,
      }),
    ).rejects.toThrow("Serviço ou profissional indisponível nesta barbearia.")
    expect(await countBookings()).toBe(before)
  })

  it("rejects an inactive employee", async () => {
    mockSession((await createUser()).id)
    await prisma.employee.update({
      where: { id: f.employeeA.id },
      data: { isActive: false },
    })

    await expect(
      createBooking("barbearia-a", {
        barbershopServiceId: f.serviceA.id,
        employeeId: f.employeeA.id,
        bookingDate: SLOT,
      }),
    ).rejects.toThrow("Serviço ou profissional indisponível nesta barbearia.")
  })

  it("rejects an employee who does not offer the service", async () => {
    mockSession((await createUser()).id)
    const otherBarber = await createUser()
    const unlinked = await createEmployee(otherBarber.id, f.shopA.id, [])

    await expect(
      createBooking("barbearia-a", {
        barbershopServiceId: f.serviceA.id,
        employeeId: unlinked.id,
        bookingDate: SLOT,
      }),
    ).rejects.toThrow("Serviço ou profissional indisponível nesta barbearia.")
  })

  it.each(["ADMIN", "ATENDENTE"] as const)(
    "rejects a %s of this shop",
    async (role) => {
      const staff = await createUser()
      await createMembership(staff.id, f.shopA.id, role)
      mockSession(staff.id)
      const before = await countBookings()

      await expect(
        createBooking("barbearia-a", {
          barbershopServiceId: f.serviceA.id,
          employeeId: f.employeeA.id,
          bookingDate: SLOT,
        }),
      ).rejects.toThrow(
        "Administradores e atendentes não podem realizar agendamentos.",
      )
      expect(await countBookings()).toBe(before)
    },
  )

  it("allows an ATENDENTE of shop A to book in shop B", async () => {
    const atendente = await createUser()
    await createMembership(atendente.id, f.shopA.id, "ATENDENTE")
    mockSession(atendente.id)

    await createBooking("barbearia-b", {
      barbershopServiceId: f.serviceB.id,
      employeeId: f.employeeB.id,
      bookingDate: SLOT,
    })

    const booking = await prisma.booking.findFirstOrThrow({
      where: { userId: atendente.id },
    })
    expect(booking.barbershopId).toBe(f.shopB.id)
  })
})

describe("replaceBooking", () => {
  it("cancels the old booking and creates the new one in the slug's shop", async () => {
    mockSession(f.client.id)
    const old = await prisma.booking.findFirstOrThrow({
      where: { userId: f.client.id, barbershopId: f.shopB.id },
    })

    await replaceBooking("barbearia-a", {
      oldBookingId: old.id,
      barbershopServiceId: f.serviceA.id,
      employeeId: f.employeeA.id,
      bookingDate: SLOT,
    })

    const cancelled = await prisma.booking.findUniqueOrThrow({
      where: { id: old.id },
    })
    expect(cancelled.status).toBe("CANCELLED")

    const created = await prisma.booking.findFirstOrThrow({
      where: { userId: f.client.id, bookingDate: SLOT },
    })
    expect(created.barbershopId).toBe(f.shopA.id)
  })

  it("rejects a service from another shop and keeps the old booking", async () => {
    mockSession(f.client.id)
    const old = await prisma.booking.findFirstOrThrow({
      where: { userId: f.client.id, barbershopId: f.shopA.id },
    })

    await expect(
      replaceBooking("barbearia-a", {
        oldBookingId: old.id,
        barbershopServiceId: f.serviceB.id,
        employeeId: f.employeeA.id,
        bookingDate: SLOT,
      }),
    ).rejects.toThrow("Serviço ou profissional indisponível nesta barbearia.")

    const unchanged = await prisma.booking.findUniqueOrThrow({
      where: { id: old.id },
    })
    expect(unchanged.status).toBe("PENDING")
  })

  it("rejects replacing someone else's booking", async () => {
    const stranger = await createUser()
    mockSession(stranger.id)
    const old = await prisma.booking.findFirstOrThrow({
      where: { userId: f.client.id, barbershopId: f.shopA.id },
    })

    await expect(
      replaceBooking("barbearia-a", {
        oldBookingId: old.id,
        barbershopServiceId: f.serviceA.id,
        employeeId: f.employeeA.id,
        bookingDate: SLOT,
      }),
    ).rejects.toThrow("Reserva original não encontrada.")
  })
})
