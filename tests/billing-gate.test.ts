import { beforeEach, describe, expect, it } from "vitest"
import { prisma } from "@/app/_lib/prisma"
import { addDays, GRACE_DAYS } from "@/app/_lib/plans"
import {
  assertShopRole,
  getTenant,
  requireShopRole,
  shopHasAccess,
} from "@/app/_lib/tenant"
import {
  getFirstShopWithRole,
  getStaffLandingPath,
} from "@/app/_lib/staff-shop"
import { searchShops } from "@/app/_data/search-shops"
import { createBooking } from "@/app/_actions/create-booking"
import { replaceBooking } from "@/app/_actions/replace-booking"
import { createWalkInBooking } from "@/app/_actions/create-walkin-booking"
import { getBookings } from "@/app/_actions/get-bookings"
import { getEmployeeSchedule } from "@/app/_actions/get-employee-schedule"
import { getEmployeesForService } from "@/app/_actions/get-employees-for-service"
import { deleteBooking } from "@/app/_actions/delete-booking"
import { createReview } from "@/app/_actions/create-review"
import { createService as createServiceAction } from "@/app/_actions/create-service"
import BillingBlockedPage from "@/app/b/[slug]/assinatura-pendente/page"
import { unwrap } from "@/app/_lib/action-result"
import type { SubscriptionStatus } from "@/app/generated/prisma/enums"
import {
  createEmployee,
  createMembership,
  createService,
  createShop,
  createUser,
} from "./helpers/factories"
import { mockSession } from "./helpers/session"

const PENDING = "A assinatura desta barbearia está pendente."
const UNAVAILABLE = "Agendamentos indisponíveis no momento."

const DAY_MS = 24 * 60 * 60 * 1000
// A Monday, far in the future
const SLOT = new Date("2030-01-07T16:00:00.000Z")
const OTHER_SLOT = new Date("2030-01-07T17:00:00.000Z")

const redirectTo = (url: string) =>
  expect.objectContaining({ name: "RedirectError", url })

// Billing states, relative to now
const UNPAID_STATES: [string, BillingFields][] = [
  [
    "an ended trial",
    {
      subscriptionStatus: "TRIALING",
      trialEndsAt: new Date(Date.now() - 1000),
    },
  ],
  ["a canceled subscription", { subscriptionStatus: "CANCELED" }],
  [
    "a past-due subscription after the grace period",
    {
      subscriptionStatus: "PAST_DUE",
      pastDueSince: addDays(new Date(), -GRACE_DAYS - 1),
    },
  ],
]

type BillingFields = {
  subscriptionStatus: SubscriptionStatus
  trialEndsAt?: Date | null
  pastDueSince?: Date | null
}

const setBilling = (barbershopId: string, data: BillingFields) =>
  prisma.barbershop.update({ where: { id: barbershopId }, data })

const CANCELED: BillingFields = { subscriptionStatus: "CANCELED" }

type Fixture = Awaited<ReturnType<typeof seed>>
let f: Fixture

// One shop (A) with every staff role, a bookable service and a client with a
// future booking and a past one
const seed = async () => {
  const shopA = await createShop({ slug: "barbearia-a", name: "Barbearia A" })

  const admin = await createUser({ name: "Admin" })
  const atendente = await createUser({ name: "Atendente" })
  const barber = await createUser({ name: "Barbeiro" })
  const client = await createUser({ name: "Cliente" })
  const outsider = await createUser({ name: "Fora" })
  await createMembership(admin.id, shopA.id, "ADMIN")
  await createMembership(atendente.id, shopA.id, "ATENDENTE")

  const service = await createService(shopA.id)
  const employee = await createEmployee(barber.id, shopA.id, [service.id])
  await prisma.employeeSchedule.create({
    data: {
      employeeId: employee.id,
      weekday: "MONDAY",
      startTime: "09:00",
      endTime: "18:00",
    },
  })

  const futureBooking = await prisma.booking.create({
    data: {
      barbershopId: shopA.id,
      barbershopServiceId: service.id,
      employeeId: employee.id,
      userId: client.id,
      bookingDate: SLOT,
    },
  })
  const pastBooking = await prisma.booking.create({
    data: {
      barbershopId: shopA.id,
      barbershopServiceId: service.id,
      employeeId: employee.id,
      userId: client.id,
      bookingDate: new Date(Date.now() - DAY_MS),
      status: "COMPLETED",
    },
  })

  return {
    shopA,
    admin,
    atendente,
    barber,
    client,
    outsider,
    service,
    employee,
    futureBooking,
    pastBooking,
  }
}

beforeEach(async () => {
  f = await seed()
})

describe("tenant object", () => {
  it("rehydrates pastDueSince as a Date and keeps Stripe ids out", async () => {
    const since = new Date(Date.now() - DAY_MS)
    await setBilling(f.shopA.id, {
      subscriptionStatus: "PAST_DUE",
      pastDueSince: since,
    })

    const tenant = await getTenant("barbearia-a")

    expect(tenant.pastDueSince).toBeInstanceOf(Date)
    expect(tenant.pastDueSince?.getTime()).toBe(since.getTime())
    expect(tenant).not.toHaveProperty("stripeCustomerId")
    expect(tenant).not.toHaveProperty("stripeSubscriptionId")
  })
})

describe("page gate (requireShopRole)", () => {
  it.each(UNPAID_STATES)(
    "sends the ADMIN of a shop with %s to the billing page",
    async (_, billing) => {
      await setBilling(f.shopA.id, billing)
      mockSession(f.admin.id)

      await expect(requireShopRole("barbearia-a", ["ADMIN"])).rejects.toEqual(
        redirectTo("/b/barbearia-a/admin/billing"),
      )
    },
  )

  it("sends the ADMIN to billing from the front desk and staff areas too", async () => {
    await setBilling(f.shopA.id, CANCELED)
    mockSession(f.admin.id)

    await expect(
      requireShopRole("barbearia-a", ["ATENDENTE", "ADMIN"]),
    ).rejects.toEqual(redirectTo("/b/barbearia-a/admin/billing"))
    await expect(
      requireShopRole("barbearia-a", ["EMPLOYEE", "ADMIN"]),
    ).rejects.toEqual(redirectTo("/b/barbearia-a/admin/billing"))
  })

  it("sends an atendente and a barber to the blocked screen", async () => {
    await setBilling(f.shopA.id, CANCELED)

    mockSession(f.atendente.id)
    await expect(
      requireShopRole("barbearia-a", ["ATENDENTE", "ADMIN"]),
    ).rejects.toEqual(redirectTo("/b/barbearia-a/assinatura-pendente"))

    mockSession(f.barber.id)
    await expect(
      requireShopRole("barbearia-a", ["EMPLOYEE", "ADMIN"]),
    ).rejects.toEqual(redirectTo("/b/barbearia-a/assinatura-pendente"))
  })

  it("checks the role before billing (outsiders learn nothing)", async () => {
    await setBilling(f.shopA.id, CANCELED)
    mockSession(f.outsider.id)

    await expect(requireShopRole("barbearia-a", ["ADMIN"])).rejects.toEqual(
      redirectTo("/b/barbearia-a"),
    )
  })

  it("lets allowUnpaid through for the right role only", async () => {
    await setBilling(f.shopA.id, CANCELED)

    mockSession(f.admin.id)
    const access = await requireShopRole("barbearia-a", ["ADMIN"], {
      allowUnpaid: true,
    })
    expect(access.shop.id).toBe(f.shopA.id)

    mockSession(f.atendente.id)
    await expect(
      requireShopRole("barbearia-a", ["ADMIN"], { allowUnpaid: true }),
    ).rejects.toEqual(redirectTo("/b/barbearia-a"))
  })

  it("keeps access during the trial, when active and inside the grace period", async () => {
    mockSession(f.admin.id)

    // Fresh trial (factory default)
    await expect(
      requireShopRole("barbearia-a", ["ADMIN"]),
    ).resolves.toBeTruthy()

    await setBilling(f.shopA.id, { subscriptionStatus: "ACTIVE" })
    await expect(
      requireShopRole("barbearia-a", ["ADMIN"]),
    ).resolves.toBeTruthy()

    await setBilling(f.shopA.id, {
      subscriptionStatus: "PAST_DUE",
      pastDueSince: addDays(new Date(), -(GRACE_DAYS - 1)),
    })
    await expect(
      requireShopRole("barbearia-a", ["ADMIN"]),
    ).resolves.toBeTruthy()
    mockSession(f.atendente.id)
    await expect(
      requireShopRole("barbearia-a", ["ATENDENTE", "ADMIN"]),
    ).resolves.toBeTruthy()
  })

  it("keeps a suspended unpaid shop a 404", async () => {
    await prisma.barbershop.update({
      where: { id: f.shopA.id },
      data: { status: "SUSPENDED", subscriptionStatus: "CANCELED" },
    })
    mockSession(f.admin.id)

    await expect(
      requireShopRole("barbearia-a", ["ADMIN"], { allowUnpaid: true }),
    ).rejects.toMatchObject({ name: "NotFoundError" })
  })
})

describe("action gate (assertShopRole)", () => {
  it.each(UNPAID_STATES)(
    "refuses staff actions of a shop with %s",
    async (_, billing) => {
      await setBilling(f.shopA.id, billing)
      mockSession(f.admin.id)

      await expect(assertShopRole("barbearia-a", ["ADMIN"])).rejects.toThrow(
        PENDING,
      )
    },
  )

  it("still answers 'Sem permissão.' to non-members of an unpaid shop", async () => {
    await setBilling(f.shopA.id, CANCELED)
    mockSession(f.outsider.id)

    await expect(assertShopRole("barbearia-a", ["ADMIN"])).rejects.toThrow(
      "Sem permissão.",
    )
  })

  it("lets allowUnpaid through", async () => {
    await setBilling(f.shopA.id, CANCELED)
    mockSession(f.admin.id)

    const access = await assertShopRole("barbearia-a", ["ADMIN"], {
      allowUnpaid: true,
    })
    expect(access.membership.role).toBe("ADMIN")
  })

  it("lets a PAST_DUE shop inside its grace period act", async () => {
    await setBilling(f.shopA.id, {
      subscriptionStatus: "PAST_DUE",
      pastDueSince: new Date(Date.now() - DAY_MS),
    })
    mockSession(f.admin.id)

    await unwrap(
      createServiceAction("barbearia-a", {
        name: "Corte na carência",
        description: "Criado durante a carência",
        price: 40,
        durationInMinutes: 30,
        imageUrl: "https://utfs.io/f/novo.png",
      }),
    )
    expect(
      await prisma.barbershopService.count({
        where: { name: "Corte na carência" },
      }),
    ).toBe(1)
  })

  it("expires a trial on the next request without a cache flush", () => {
    const shop = {
      subscriptionStatus: "TRIALING" as const,
      trialEndsAt: new Date(Date.now() + 1000),
      pastDueSince: null,
    }
    // shopHasAccess only reads the billing fields
    const tenant = shop as unknown as Parameters<typeof shopHasAccess>[0]

    expect(shopHasAccess(tenant)).toBe(true)
    expect(shopHasAccess(tenant, new Date(Date.now() + 2000))).toBe(false)
  })
})

describe("bookings of an unpaid shop", () => {
  beforeEach(async () => {
    await setBilling(f.shopA.id, CANCELED)
  })

  it("refuses a customer booking", async () => {
    mockSession((await createUser()).id)

    await expect(
      unwrap(
        createBooking("barbearia-a", {
          barbershopServiceId: f.service.id,
          employeeId: f.employee.id,
          bookingDate: OTHER_SLOT,
        }),
      ),
    ).rejects.toThrow(UNAVAILABLE)
    expect(await prisma.booking.count()).toBe(2)
  })

  it("refuses a replacement and keeps the old booking", async () => {
    mockSession(f.client.id)

    await expect(
      unwrap(
        replaceBooking("barbearia-a", {
          oldBookingId: f.futureBooking.id,
          barbershopServiceId: f.service.id,
          employeeId: f.employee.id,
          bookingDate: OTHER_SLOT,
        }),
      ),
    ).rejects.toThrow(UNAVAILABLE)

    const old = await prisma.booking.findUniqueOrThrow({
      where: { id: f.futureBooking.id },
    })
    expect(old.status).toBe("PENDING")
  })

  it("refuses a walk-in booking", async () => {
    mockSession(f.atendente.id)

    await expect(
      unwrap(
        createWalkInBooking("barbearia-a", {
          employeeId: f.employee.id,
          barbershopServiceId: f.service.id,
          bookingDate: OTHER_SLOT,
          clientName: "Cliente Balcão",
        }),
      ),
    ).rejects.toThrow(PENDING)
    expect(await prisma.booking.count()).toBe(2)
  })

  it("refuses the slot lookups behind the booking sheet", async () => {
    await expect(
      getBookings("barbearia-a", { employeeId: f.employee.id, date: SLOT }),
    ).rejects.toThrow(UNAVAILABLE)
    await expect(
      getEmployeeSchedule("barbearia-a", f.employee.id, SLOT),
    ).rejects.toThrow(UNAVAILABLE)
    await expect(
      getEmployeesForService("barbearia-a", f.service.id),
    ).rejects.toThrow(UNAVAILABLE)
  })

  it("still lets the client cancel their own booking", async () => {
    mockSession(f.client.id)

    await unwrap(deleteBooking(f.futureBooking.id))

    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: f.futureBooking.id },
    })
    expect(booking.status).toBe("CANCELLED")
  })

  it("still lets the client review a past booking", async () => {
    mockSession(f.client.id)

    await unwrap(
      createReview({
        bookingId: f.pastBooking.id,
        employeeId: f.employee.id,
        rating: 5,
      }),
    )

    expect(
      await prisma.review.count({ where: { bookingId: f.pastBooking.id } }),
    ).toBe(1)
  })
})

describe("shop finder", () => {
  it.each(UNPAID_STATES)("hides a shop with %s", async (_, billing) => {
    await setBilling(f.shopA.id, billing)

    const { shops } = await searchShops("Barbearia A")

    expect(shops).toEqual([])
  })

  it("lists trialing, active and in-grace shops", async () => {
    await createShop({
      slug: "ativa",
      name: "Ativa",
      subscriptionStatus: "ACTIVE",
    })
    await createShop({
      slug: "carencia",
      name: "Carência",
      subscriptionStatus: "PAST_DUE",
      pastDueSince: new Date(Date.now() - DAY_MS),
    })
    await createShop({
      slug: "cancelada",
      name: "Cancelada",
      subscriptionStatus: "CANCELED",
    })

    const { shops } = await searchShops("")

    expect(shops.map((shop) => shop.slug).sort()).toEqual([
      "ativa",
      "barbearia-a",
      "carencia",
    ])
  })

  it("keeps the billing filter when there is a query", async () => {
    await createShop({
      slug: "cancelada",
      name: "Barbearia Cancelada",
      subscriptionStatus: "CANCELED",
    })

    const { shops } = await searchShops("barbearia")

    expect(shops.map((shop) => shop.slug)).toEqual(["barbearia-a"])
  })
})

describe("staff landing of an unpaid shop", () => {
  beforeEach(async () => {
    await setBilling(f.shopA.id, CANCELED)
  })

  it("still routes staff to their area (which then shows billing or the blocked screen)", async () => {
    expect(await getStaffLandingPath(f.admin.id)).toBe("/b/barbearia-a/admin")
    expect(await getStaffLandingPath(f.barber.id)).toBe("/b/barbearia-a/staff")
  })

  it("lets / skip the barber redirect for an unpaid shop", async () => {
    expect(
      await getFirstShopWithRole(f.barber.id, ["EMPLOYEE"], {
        billingActiveOnly: true,
      }),
    ).toBeNull()
    expect(await getFirstShopWithRole(f.barber.id, ["EMPLOYEE"])).toMatchObject(
      { slug: "barbearia-a" },
    )
  })
})

describe("blocked screen (/b/[slug]/assinatura-pendente)", () => {
  const render = () =>
    BillingBlockedPage({ params: Promise.resolve({ slug: "barbearia-a" }) })

  it("renders for an atendente of an unpaid shop", async () => {
    await setBilling(f.shopA.id, CANCELED)
    mockSession(f.atendente.id)

    await expect(render()).resolves.toBeTruthy()
  })

  it("sends the ADMIN to billing", async () => {
    await setBilling(f.shopA.id, CANCELED)
    mockSession(f.admin.id)

    await expect(render()).rejects.toEqual(
      redirectTo("/b/barbearia-a/admin/billing"),
    )
  })

  it("sends staff of a shop in good standing back to their area", async () => {
    mockSession(f.atendente.id)

    await expect(render()).rejects.toEqual(
      redirectTo("/b/barbearia-a/atendente"),
    )
  })

  it("sends outsiders and signed-out visitors to the shop page", async () => {
    await setBilling(f.shopA.id, CANCELED)

    await expect(render()).rejects.toEqual(redirectTo("/b/barbearia-a"))

    mockSession(f.outsider.id)
    await expect(render()).rejects.toEqual(redirectTo("/b/barbearia-a"))
  })
})
