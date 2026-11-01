import { beforeEach, describe, expect, it } from "vitest"
import { updateTag } from "next/cache"
import { prisma } from "@/app/_lib/prisma"
import { shopTag } from "@/app/_lib/tenant"
import {
  getBrazilDateKey,
  getBrazilDayRange,
  getBrazilMonthRange,
} from "@/app/_lib/timezone"
import { createService } from "@/app/_actions/create-service"
import { updateService } from "@/app/_actions/update-service"
import { deleteService } from "@/app/_actions/delete-service"
import { createExpense } from "@/app/_actions/create-expense"
import { updateExpense } from "@/app/_actions/update-expense"
import { deleteExpense } from "@/app/_actions/delete-expense"
import { updateBarbershop } from "@/app/_actions/update-barbershop"
import { createEmployee } from "@/app/_actions/create-employee"
import { updateEmployee } from "@/app/_actions/update-employee"
import { updateEmployeeSchedule } from "@/app/_actions/update-employee-schedule"
import { updateEmployeeServices } from "@/app/_actions/update-employee-services"
import { deleteEmployee } from "@/app/_actions/delete-employee"
import { createAtendente } from "@/app/_actions/create-atendente"
import { deleteAtendente } from "@/app/_actions/delete-atendente"
import { getDashboardStats } from "@/app/_actions/get-dashboard-stats"
import { getMonthlyOverview } from "@/app/_actions/get-monthly-overview"
import { getNetProfit } from "@/app/_actions/get-net-profit"
import { getExpensesOverview } from "@/app/_actions/get-expenses-overview"
import { getEmployeesOverview } from "@/app/_actions/get-employees-overview"
import { getEmployeeStats } from "@/app/_actions/get-employee-stats"
import { getBarbershopOverview } from "@/app/_actions/get-barbershop-overwiew"
import { getAdminBookings } from "@/app/_data/get-admin-bookings"
import { getAdminServices } from "@/app/_data/get-admin-services"
import { getAdminExpenses } from "@/app/_data/get-admin-expenses"
import { getAdminEmployees } from "@/app/_data/get-admin-employees"
import { getAdminAtendentes } from "@/app/_data/get-admin-atendentes"
import { getAllServices } from "@/app/_data/get-all-services"
import {
  createEmployee as createEmployeeRow,
  createMembership,
  createService as createServiceRow,
  createShop,
  createUser,
} from "./helpers/factories"
import { mockSession } from "./helpers/session"
import { unwrap } from "@/app/_lib/action-result"

const SERVICE_INPUT = {
  name: "Corte novo",
  description: "Descrição do corte novo",
  price: 40,
  durationInMinutes: 30,
  imageUrl: "https://utfs.io/f/novo.png",
}

const EXPENSE_INPUT = {
  description: "Conta de luz",
  amount: 120,
  category: "CONTAS",
  date: new Date("2030-01-07T15:00:00.000Z"),
}

const BARBERSHOP_INPUT = {
  name: "Barbearia A Nova",
  description: "Nova descrição da barbearia A",
  address: "Rua Nova, 10",
  city: "Campinas",
  latitude: "",
  longitude: "",
  logoUrl: "",
  bannerUrl: "https://utfs.io/f/a.png",
  instagramUrl: "",
  phones: ["11988888888"],
}

const SCHEDULE_INPUT = [
  {
    weekday: "MONDAY" as const,
    startTime: "10:00",
    endTime: "16:00",
    isDayOff: false,
  },
]

type Fixture = Awaited<ReturnType<typeof seedTwoShops>>
let f: Fixture

// Two shops, each with an ADMIN, a service, an employee, an atendente, an
// expense and one concluded booking inside the current month. A barber works
// in both shops.
const seedTwoShops = async () => {
  const shopA = await createShop({ slug: "barbearia-a", name: "Barbearia A" })
  const shopB = await createShop({ slug: "barbearia-b", name: "Barbearia B" })

  const adminA = await createUser({ name: "Admin A" })
  const adminB = await createUser({ name: "Admin B" })
  await createMembership(adminA.id, shopA.id, "ADMIN")
  await createMembership(adminB.id, shopB.id, "ADMIN")

  const serviceA = await createServiceRow(shopA.id, { price: 50 })
  const serviceB = await createServiceRow(shopB.id, { price: 80 })

  const sharedBarber = await createUser({ name: "Barbeiro Compartilhado" })
  const employeeA = await createEmployeeRow(sharedBarber.id, shopA.id, [
    serviceA.id,
  ])
  const employeeB = await createEmployeeRow(sharedBarber.id, shopB.id, [
    serviceB.id,
  ])

  const atendenteA = await createUser({ name: "Atendente A" })
  const atendenteB = await createUser({ name: "Atendente B" })
  await createMembership(atendenteA.id, shopA.id, "ATENDENTE")
  await createMembership(atendenteB.id, shopB.id, "ATENDENTE")

  // One hour after the start of the current Brazil month: concluded, and
  // inside every "this month" range
  const { rangeStart } = getBrazilMonthRange(new Date())
  const pastThisMonth = new Date(rangeStart.getTime() + 60 * 60 * 1000)

  const client = await createUser({ name: "Cliente" })
  const bookingA = await prisma.booking.create({
    data: {
      barbershopId: shopA.id,
      barbershopServiceId: serviceA.id,
      employeeId: employeeA.id,
      userId: client.id,
      bookingDate: pastThisMonth,
    },
  })
  const bookingB = await prisma.booking.create({
    data: {
      barbershopId: shopB.id,
      barbershopServiceId: serviceB.id,
      employeeId: employeeB.id,
      userId: client.id,
      bookingDate: pastThisMonth,
    },
  })

  const expenseA = await prisma.expense.create({
    data: {
      barbershopId: shopA.id,
      description: "Aluguel A",
      amount: 10,
      category: "ALUGUEL",
      date: pastThisMonth,
    },
  })
  const expenseB = await prisma.expense.create({
    data: {
      barbershopId: shopB.id,
      description: "Aluguel B",
      amount: 30,
      category: "ALUGUEL",
      date: pastThisMonth,
    },
  })

  return {
    shopA,
    shopB,
    adminA,
    adminB,
    serviceA,
    serviceB,
    sharedBarber,
    employeeA,
    employeeB,
    atendenteA,
    atendenteB,
    client,
    bookingA,
    bookingB,
    expenseA,
    expenseB,
    pastThisMonth,
  }
}

beforeEach(async () => {
  f = await seedTwoShops()
  mockSession(f.adminA.id)
})

describe("admin access", () => {
  it("rejects a signed-out user", async () => {
    mockSession(null)

    await expect(
      unwrap(createService("barbearia-a", SERVICE_INPUT)),
    ).rejects.toThrow("Você precisa estar logado.")
  })

  it("rejects a user without a membership in the shop", async () => {
    mockSession(f.client.id)

    await expect(
      unwrap(createService("barbearia-a", SERVICE_INPUT)),
    ).rejects.toThrow("Sem permissão.")
    await expect(getNetProfit("barbearia-a")).rejects.toThrow("Sem permissão.")
    expect(
      await prisma.barbershopService.count({ where: { name: "Corte novo" } }),
    ).toBe(0)
  })

  it("rejects staff that are not ADMIN", async () => {
    mockSession(f.atendenteA.id)
    await expect(
      getDashboardStats("barbearia-a", { period: "month", date: new Date() }),
    ).rejects.toThrow("Sem permissão.")

    mockSession(f.sharedBarber.id)
    await expect(
      unwrap(deleteExpense("barbearia-a", f.expenseA.id)),
    ).rejects.toThrow("Sem permissão.")
    expect(await prisma.expense.count({ where: { id: f.expenseA.id } })).toBe(1)
  })

  it("rejects the admin of shop A acting on shop B (foreign slug)", async () => {
    await expect(
      unwrap(createService("barbearia-b", SERVICE_INPUT)),
    ).rejects.toThrow("Sem permissão.")
    await expect(
      unwrap(
        updateBarbershop("barbearia-b", {
          ...BARBERSHOP_INPUT,
          name: "Invadida",
        }),
      ),
    ).rejects.toThrow("Sem permissão.")
    await expect(
      unwrap(deleteService("barbearia-b", f.serviceB.id)),
    ).rejects.toThrow("Sem permissão.")
    await expect(getNetProfit("barbearia-b")).rejects.toThrow("Sem permissão.")

    const shopB = await prisma.barbershop.findUniqueOrThrow({
      where: { id: f.shopB.id },
    })
    expect(shopB.name).toBe("Barbearia B")
    expect(
      await prisma.barbershopService.count({ where: { id: f.serviceB.id } }),
    ).toBe(1)
  })
})

describe("services", () => {
  it("creates the service in the admin's shop and revalidates it", async () => {
    await unwrap(createService("barbearia-a", SERVICE_INPUT))

    const created = await prisma.barbershopService.findFirstOrThrow({
      where: { name: "Corte novo" },
    })
    expect(created.barbershopId).toBe(f.shopA.id)
    expect(updateTag).toHaveBeenCalledWith(shopTag(f.shopA.id))
  })

  it("does not update a service of another shop", async () => {
    await expect(
      unwrap(updateService("barbearia-a", f.serviceB.id, SERVICE_INPUT)),
    ).rejects.toThrow("Serviço não encontrado.")

    const serviceB = await prisma.barbershopService.findUniqueOrThrow({
      where: { id: f.serviceB.id },
    })
    expect(serviceB.name).toBe(f.serviceB.name)
  })

  it("does not delete a service of another shop", async () => {
    await expect(
      unwrap(deleteService("barbearia-a", f.serviceB.id)),
    ).rejects.toThrow("Serviço não encontrado.")
    expect(
      await prisma.barbershopService.count({ where: { id: f.serviceB.id } }),
    ).toBe(1)
  })

  it("updates its own service", async () => {
    await unwrap(updateService("barbearia-a", f.serviceA.id, SERVICE_INPUT))

    const serviceA = await prisma.barbershopService.findUniqueOrThrow({
      where: { id: f.serviceA.id },
    })
    expect(serviceA.name).toBe("Corte novo")
  })
})

describe("expenses", () => {
  it("creates the expense in the admin's shop", async () => {
    await unwrap(createExpense("barbearia-a", EXPENSE_INPUT))

    const created = await prisma.expense.findFirstOrThrow({
      where: { description: "Conta de luz" },
    })
    expect(created.barbershopId).toBe(f.shopA.id)
  })

  it("does not update or delete an expense of another shop", async () => {
    await expect(
      unwrap(updateExpense("barbearia-a", f.expenseB.id, EXPENSE_INPUT)),
    ).rejects.toThrow("Despesa não encontrada.")
    await expect(
      unwrap(deleteExpense("barbearia-a", f.expenseB.id)),
    ).rejects.toThrow("Despesa não encontrada.")

    const expenseB = await prisma.expense.findUniqueOrThrow({
      where: { id: f.expenseB.id },
    })
    expect(expenseB.description).toBe("Aluguel B")
  })

  it("deletes its own expense", async () => {
    await unwrap(deleteExpense("barbearia-a", f.expenseA.id))

    expect(await prisma.expense.count({ where: { id: f.expenseA.id } })).toBe(0)
  })
})

describe("barbershop", () => {
  it("updates only the admin's shop", async () => {
    await unwrap(updateBarbershop("barbearia-a", BARBERSHOP_INPUT))

    const [shopA, shopB] = await Promise.all([
      prisma.barbershop.findUniqueOrThrow({ where: { id: f.shopA.id } }),
      prisma.barbershop.findUniqueOrThrow({ where: { id: f.shopB.id } }),
    ])
    expect(shopA.name).toBe("Barbearia A Nova")
    expect(shopA.city).toBe("Campinas")
    expect(shopA.logoUrl).toBeNull()
    expect(shopA.latitude).toBeNull()
    expect(shopB.name).toBe("Barbearia B")
    expect(updateTag).toHaveBeenCalledWith(shopTag(f.shopA.id))
  })

  it("saves the uploaded logo, banner and the coordinates", async () => {
    await unwrap(
      updateBarbershop("barbearia-a", {
        ...BARBERSHOP_INPUT,
        logoUrl: "https://abc123.ufs.sh/f/logo.png",
        bannerUrl: "https://abc123.ufs.sh/f/banner.png",
        latitude: "-23,5568",
        longitude: "-46.6608",
      }),
    )

    const shopA = await prisma.barbershop.findUniqueOrThrow({
      where: { id: f.shopA.id },
    })
    expect(shopA.logoUrl).toBe("https://abc123.ufs.sh/f/logo.png")
    expect(shopA.bannerUrl).toBe("https://abc123.ufs.sh/f/banner.png")
    expect(shopA.latitude).toBe(-23.5568)
    expect(shopA.longitude).toBe(-46.6608)
  })

  it.each([
    [
      "an image from a host next/image does not allow",
      { logoUrl: "https://evil.example.com/logo.png" },
      "Envie uma imagem ou informe uma URL do UploadThing ou do Unsplash.",
    ],
    [
      "a javascript: banner",
      { bannerUrl: "javascript:alert(1)" },
      "Envie uma imagem ou informe uma URL do UploadThing ou do Unsplash.",
    ],
    [
      "a latitude out of range",
      { latitude: "123", longitude: "-46.6" },
      "Latitude inválida (entre -90 e 90).",
    ],
    [
      "only one coordinate",
      { latitude: "-23.5", longitude: "" },
      "Informe a latitude e a longitude, ou deixe as duas em branco.",
    ],
    ["an empty city", { city: " " }, "Informe a cidade."],
  ])("rejects %s and changes nothing", async (_, override, message) => {
    await expect(
      unwrap(
        updateBarbershop("barbearia-a", { ...BARBERSHOP_INPUT, ...override }),
      ),
    ).rejects.toThrow(message)

    const shopA = await prisma.barbershop.findUniqueOrThrow({
      where: { id: f.shopA.id },
    })
    expect(shopA.name).toBe("Barbearia A")
  })

  it("rejects an atendente of the shop", async () => {
    mockSession(f.atendenteA.id)

    await expect(
      unwrap(updateBarbershop("barbearia-a", BARBERSHOP_INPUT)),
    ).rejects.toThrow("Sem permissão.")
  })
})

describe("employees", () => {
  it("creates the employee with a membership in the admin's shop", async () => {
    await unwrap(
      createEmployee("barbearia-a", {
        name: "Novo Barbeiro",
        email: "novo@test.local",
        password: "Senha12345!",
      }),
    )

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "novo@test.local" },
      include: { employees: true, memberships: true },
    })
    expect(user.employees.map((e) => e.barbershopId)).toEqual([f.shopA.id])
    expect(user.memberships).toMatchObject([
      { barbershopId: f.shopA.id, role: "EMPLOYEE" },
    ])
  })

  it("does not update an employee of another shop", async () => {
    await expect(
      unwrap(
        updateEmployee("barbearia-a", f.employeeB.id, { bio: "Hackeado" }),
      ),
    ).rejects.toThrow("Funcionário não encontrado.")

    const employeeB = await prisma.employee.findUniqueOrThrow({
      where: { id: f.employeeB.id },
    })
    expect(employeeB.bio).toBeNull()
  })

  it("does not change the schedule of an employee of another shop", async () => {
    await expect(
      unwrap(
        updateEmployeeSchedule("barbearia-a", f.employeeB.id, SCHEDULE_INPUT),
      ),
    ).rejects.toThrow("Funcionário não encontrado.")

    expect(
      await prisma.employeeSchedule.count({
        where: { employeeId: f.employeeB.id },
      }),
    ).toBe(0)
  })

  it("does not change the services of an employee of another shop", async () => {
    await expect(
      unwrap(
        updateEmployeeServices("barbearia-a", f.employeeB.id, [f.serviceA.id]),
      ),
    ).rejects.toThrow("Funcionário não encontrado.")

    const links = await prisma.employeeService.findMany({
      where: { employeeId: f.employeeB.id },
    })
    expect(links.map((link) => link.serviceId)).toEqual([f.serviceB.id])
  })

  it("does not link a service of another shop", async () => {
    await expect(
      unwrap(
        updateEmployeeServices("barbearia-a", f.employeeA.id, [
          f.serviceA.id,
          f.serviceB.id,
        ]),
      ),
    ).rejects.toThrow("Serviço não encontrado.")

    const links = await prisma.employeeService.findMany({
      where: { employeeId: f.employeeA.id },
    })
    expect(links.map((link) => link.serviceId)).toEqual([f.serviceA.id])
  })

  it("does not delete an employee of another shop", async () => {
    await prisma.booking.deleteMany({ where: { employeeId: f.employeeB.id } })

    await expect(
      unwrap(deleteEmployee("barbearia-a", f.employeeB.id)),
    ).rejects.toThrow("Funcionário não encontrado.")
    expect(await prisma.employee.count({ where: { id: f.employeeB.id } })).toBe(
      1,
    )
  })

  it("removes the employee from this shop only and keeps the user", async () => {
    await prisma.booking.deleteMany({ where: { employeeId: f.employeeA.id } })

    await unwrap(deleteEmployee("barbearia-a", f.employeeA.id))

    expect(await prisma.employee.count({ where: { id: f.employeeA.id } })).toBe(
      0,
    )
    expect(await prisma.employee.count({ where: { id: f.employeeB.id } })).toBe(
      1,
    )
    expect(await prisma.user.count({ where: { id: f.sharedBarber.id } })).toBe(
      1,
    )

    const memberships = await prisma.membership.findMany({
      where: { userId: f.sharedBarber.id },
    })
    expect(memberships.map((m) => m.barbershopId)).toEqual([f.shopB.id])
  })
})

describe("atendentes", () => {
  it("creates the atendente with a membership in the admin's shop", async () => {
    await unwrap(
      createAtendente("barbearia-a", {
        name: "Nova Atendente",
        email: "atendente@test.local",
        password: "Senha12345!",
      }),
    )

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "atendente@test.local" },
      include: { memberships: true },
    })
    expect(user.memberships).toMatchObject([
      { barbershopId: f.shopA.id, role: "ATENDENTE" },
    ])
  })

  it("does not remove an atendente of another shop", async () => {
    await expect(
      unwrap(deleteAtendente("barbearia-a", f.atendenteB.id)),
    ).rejects.toThrow("Atendente não encontrado.")

    expect(
      await prisma.membership.count({
        where: { userId: f.atendenteB.id, barbershopId: f.shopB.id },
      }),
    ).toBe(1)
  })

  it("does not remove a non-atendente member (e.g. the admin)", async () => {
    await expect(
      unwrap(deleteAtendente("barbearia-a", f.adminA.id)),
    ).rejects.toThrow("Atendente não encontrado.")
    expect(
      await prisma.membership.count({ where: { userId: f.adminA.id } }),
    ).toBe(1)
  })

  it("removes the membership and keeps the user", async () => {
    await unwrap(deleteAtendente("barbearia-a", f.atendenteA.id))

    expect(
      await prisma.membership.count({ where: { userId: f.atendenteA.id } }),
    ).toBe(0)
    expect(await prisma.user.count({ where: { id: f.atendenteA.id } })).toBe(1)
  })
})

describe("stats and overview actions", () => {
  it("count only the admin's shop", async () => {
    const [dashboard, monthly, netProfit, expenses, employees, overview] =
      await Promise.all([
        getDashboardStats("barbearia-a", {
          period: "month",
          date: f.pastThisMonth,
        }),
        getMonthlyOverview("barbearia-a"),
        getNetProfit("barbearia-a"),
        getExpensesOverview("barbearia-a"),
        getEmployeesOverview("barbearia-a"),
        getBarbershopOverview("barbearia-a", "90d"),
      ])

    expect(dashboard.bookingsBreakdown.total).toBe(1)
    expect(dashboard.revenueBreakdown.total).toBe(50)
    expect(dashboard.serviceStats.map((s) => s.serviceId)).toEqual([
      f.serviceA.id,
    ])
    expect(monthly.totalConcludedBookings).toBe(1)
    expect(monthly.totalConcludedRevenue).toBe(50)
    expect(netProfit).toEqual({
      concludedRevenue: 50,
      totalExpenses: 10,
      netProfit: 40,
    })
    expect(expenses.totalExpenses).toBe(10)
    expect(employees.employeeNames).toEqual(["Barbeiro"])
    // The shared barber has the same first name in both shops, so only the
    // count tells the shops apart
    const bookingDay = employees.data.find(
      (row) => row.date === getBrazilDateKey(f.pastThisMonth),
    )
    expect(bookingDay).toMatchObject({ Barbeiro: 1 })
    expect(overview.reduce((total, point) => total + point.bookings, 0)).toBe(1)
  })

  it("groups the overview by Brazil day, not UTC day", async () => {
    // 22:30 in Brazil yesterday is 01:30 UTC today: a UTC bucket would put it
    // on the wrong day
    const { rangeStart: todayStart } = getBrazilDayRange(new Date())
    const lateYesterday = new Date(todayStart.getTime() - 90 * 60 * 1000)
    await prisma.booking.create({
      data: {
        barbershopId: f.shopA.id,
        barbershopServiceId: f.serviceA.id,
        employeeId: f.employeeA.id,
        userId: f.client.id,
        bookingDate: lateYesterday,
      },
    })

    const overview = await getBarbershopOverview("barbearia-a", "7d")

    const yesterdayKey = getBrazilDateKey(lateYesterday)
    const sameDayAsFixture =
      getBrazilDateKey(f.pastThisMonth) === yesterdayKey ? 1 : 0
    expect(overview).toHaveLength(7)
    expect(overview.at(-1)?.date).toBe(getBrazilDateKey(new Date()))
    expect(overview.find((p) => p.date === yesterdayKey)?.bookings).toBe(
      1 + sameDayAsFixture,
    )
  })

  it("counts the bookings of an employee of this shop", async () => {
    const stats = await getEmployeeStats("barbearia-a", f.employeeA.id, "all")

    expect(stats).toEqual({ totalBookings: 1, totalRevenue: 50 })
  })

  it("returns nothing for an employee of another shop", async () => {
    const stats = await getEmployeeStats("barbearia-a", f.employeeB.id, "all")

    expect(stats).toEqual({ totalBookings: 0, totalRevenue: 0 })
  })
})

describe("admin fetchers", () => {
  it("return only rows of the given shop", async () => {
    const [bookings, services, expenses, employees, atendentes, allServices] =
      await Promise.all([
        getAdminBookings(f.shopA.id, "all"),
        getAdminServices(f.shopA.id),
        getAdminExpenses(f.shopA.id),
        getAdminEmployees(f.shopA.id),
        getAdminAtendentes(f.shopA.id),
        getAllServices(f.shopA.id),
      ])

    expect(bookings.bookings.map((b) => b.id)).toEqual([f.bookingA.id])
    expect(services.services.map((s) => s.id)).toEqual([f.serviceA.id])
    expect(expenses.expenses.map((e) => e.id)).toEqual([f.expenseA.id])
    expect(employees.employees.map((e) => e.id)).toEqual([f.employeeA.id])
    expect(atendentes.atendentes.map((a) => a.id)).toEqual([f.atendenteA.id])
    expect(allServices.map((s) => s.id)).toEqual([f.serviceA.id])

    const past = await getAdminBookings(f.shopA.id, "past")
    expect(past.bookings.map((b) => b.id)).toEqual([f.bookingA.id])
  })
})

// Everything that belongs to one shop, to prove an action left it untouched
const snapshotShop = async (barbershopId: string) => {
  const byId = { orderBy: { id: "asc" as const } }
  const [
    shop,
    services,
    expenses,
    employees,
    memberships,
    bookings,
    invitations,
  ] = await Promise.all([
    prisma.barbershop.findUniqueOrThrow({ where: { id: barbershopId } }),
    prisma.barbershopService.findMany({ where: { barbershopId }, ...byId }),
    prisma.expense.findMany({ where: { barbershopId }, ...byId }),
    prisma.employee.findMany({
      where: { barbershopId },
      include: { services: byId, schedules: byId },
      ...byId,
    }),
    prisma.membership.findMany({ where: { barbershopId }, ...byId }),
    prisma.booking.findMany({ where: { barbershopId }, ...byId }),
    prisma.invitation.findMany({ where: { barbershopId }, ...byId }),
  ])

  return {
    shop,
    services,
    expenses,
    employees,
    memberships,
    bookings,
    invitations,
    userCount: await prisma.user.count(),
  }
}

// Every ADMIN-only action, aimed at shop B with shop B's own ids
const adminMutationsOnShopB = (): [string, () => Promise<unknown>][] => [
  ["createService", () => unwrap(createService("barbearia-b", SERVICE_INPUT))],
  [
    "updateService",
    () => unwrap(updateService("barbearia-b", f.serviceB.id, SERVICE_INPUT)),
  ],
  ["deleteService", () => unwrap(deleteService("barbearia-b", f.serviceB.id))],
  ["createExpense", () => unwrap(createExpense("barbearia-b", EXPENSE_INPUT))],
  [
    "updateExpense",
    () => unwrap(updateExpense("barbearia-b", f.expenseB.id, EXPENSE_INPUT)),
  ],
  ["deleteExpense", () => unwrap(deleteExpense("barbearia-b", f.expenseB.id))],
  [
    "updateBarbershop",
    () => unwrap(updateBarbershop("barbearia-b", BARBERSHOP_INPUT)),
  ],
  [
    "createEmployee",
    () =>
      unwrap(
        createEmployee("barbearia-b", {
          name: "Barbeiro Novo",
          email: "novo-barbeiro@test.local",
          password: "Senha12345!",
        }),
      ),
  ],
  [
    "updateEmployee",
    () =>
      unwrap(
        updateEmployee("barbearia-b", f.employeeB.id, { bio: "Invadido" }),
      ),
  ],
  [
    "updateEmployeeSchedule",
    () =>
      unwrap(
        updateEmployeeSchedule("barbearia-b", f.employeeB.id, SCHEDULE_INPUT),
      ),
  ],
  [
    "updateEmployeeServices",
    () => unwrap(updateEmployeeServices("barbearia-b", f.employeeB.id, [])),
  ],
  [
    "deleteEmployee",
    () => unwrap(deleteEmployee("barbearia-b", f.employeeB.id)),
  ],
  [
    "createAtendente",
    () =>
      unwrap(
        createAtendente("barbearia-b", {
          name: "Atendente Nova",
          email: "nova-atendente@test.local",
          password: "Senha12345!",
        }),
      ),
  ],
  [
    "deleteAtendente",
    () => unwrap(deleteAtendente("barbearia-b", f.atendenteB.id)),
  ],
]

const adminReadsOfShopB = (): [string, () => Promise<unknown>][] => [
  [
    "getDashboardStats",
    () =>
      getDashboardStats("barbearia-b", { period: "month", date: new Date() }),
  ],
  ["getMonthlyOverview", () => getMonthlyOverview("barbearia-b")],
  ["getNetProfit", () => getNetProfit("barbearia-b")],
  ["getExpensesOverview", () => getExpensesOverview("barbearia-b")],
  ["getEmployeesOverview", () => getEmployeesOverview("barbearia-b")],
  [
    "getEmployeeStats",
    () => getEmployeeStats("barbearia-b", f.employeeB.id, "all"),
  ],
  ["getBarbershopOverview", () => getBarbershopOverview("barbearia-b", "7d")],
]

// Who must never act as shop B's admin
const outsiders = (): [string, string | null, string][] => [
  ["the admin of shop A (foreign slug)", f.adminA.id, "Sem permissão."],
  ["an atendente of shop B (wrong role)", f.atendenteB.id, "Sem permissão."],
  ["a barber of shop B (wrong role)", f.sharedBarber.id, "Sem permissão."],
  ["a client (non-member)", f.client.id, "Sem permissão."],
  ["a signed-out visitor", null, "Você precisa estar logado."],
]

describe("isolation matrix: every admin action", () => {
  it("rejects each outsider on every mutation and leaves shop B unchanged", async () => {
    const before = await snapshotShop(f.shopB.id)

    for (const [who, userId, message] of outsiders()) {
      mockSession(userId)

      for (const [name, run] of adminMutationsOnShopB()) {
        await expect(run(), `${name} by ${who}`).rejects.toThrow(message)
      }
    }

    expect(await snapshotShop(f.shopB.id)).toEqual(before)
    expect(updateTag).not.toHaveBeenCalledWith(shopTag(f.shopB.id))
  })

  it("rejects each outsider on every stats read", async () => {
    for (const [who, userId, message] of outsiders()) {
      mockSession(userId)

      for (const [name, run] of adminReadsOfShopB()) {
        await expect(run(), `${name} by ${who}`).rejects.toThrow(message)
      }
    }
  })

  it("lets shop B's own admin run every mutation (the matrix is not vacuous)", async () => {
    mockSession(f.adminB.id)
    // deleteService needs a service without bookings
    await prisma.booking.deleteMany({ where: { barbershopId: f.shopB.id } })

    for (const [name, run] of adminMutationsOnShopB()) {
      await expect(run(), name).resolves.not.toThrow()
    }
  })
})

describe("updateEmployeeServices input", () => {
  it("rejects a payload that is not a list of ids", async () => {
    await expect(
      unwrap(
        updateEmployeeServices(
          "barbearia-a",
          f.employeeA.id,
          "not-a-list" as unknown as string[],
        ),
      ),
    ).rejects.toThrow("Serviços inválidos.")
    await expect(
      unwrap(
        updateEmployeeServices("barbearia-a", f.employeeA.id, [
          { id: f.serviceA.id },
        ] as unknown as string[]),
      ),
    ).rejects.toThrow()

    const links = await prisma.employeeService.findMany({
      where: { employeeId: f.employeeA.id },
    })
    expect(links.map((link) => link.serviceId)).toEqual([f.serviceA.id])
  })

  it("does not edit a removed (inactive) barber", async () => {
    await prisma.employee.update({
      where: { id: f.employeeA.id },
      data: { isActive: false },
    })

    await expect(
      unwrap(updateEmployeeServices("barbearia-a", f.employeeA.id, [])),
    ).rejects.toThrow("Funcionário não encontrado.")
    await expect(
      unwrap(
        updateEmployeeSchedule("barbearia-a", f.employeeA.id, SCHEDULE_INPUT),
      ),
    ).rejects.toThrow("Funcionário não encontrado.")

    expect(
      await prisma.employeeService.count({
        where: { employeeId: f.employeeA.id },
      }),
    ).toBe(1)
    expect(
      await prisma.employeeSchedule.count({
        where: { employeeId: f.employeeA.id },
      }),
    ).toBe(0)
  })
})
