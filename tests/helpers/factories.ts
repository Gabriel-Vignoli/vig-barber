import { prisma } from "@/app/_lib/prisma"
import type { MemberRole, ShopStatus } from "@/app/generated/prisma/enums"

let counter = 0
const next = () => ++counter

// Empties every table (except Prisma's migration log) between tests
export const resetDatabase = async () => {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `
  if (tables.length === 0) return

  const list = tables.map(({ tablename }) => `"public"."${tablename}"`)
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${list.join(", ")} RESTART IDENTITY CASCADE`,
  )
}

export const createShop = (
  data: { slug?: string; name?: string; status?: ShopStatus } = {},
) => {
  const n = next()
  return prisma.barbershop.create({
    data: {
      slug: data.slug ?? `shop-${n}`,
      name: data.name ?? `Barbearia ${n}`,
      address: `Rua Teste, ${n}`,
      city: "São Paulo",
      description: "Barbearia de teste",
      phones: ["11999999999"],
      status: data.status ?? "ACTIVE",
    },
  })
}

export const createUser = (
  data: { name?: string; email?: string; isPlatformAdmin?: boolean } = {},
) => {
  const n = next()
  return prisma.user.create({
    data: {
      name: data.name ?? `Usuário ${n}`,
      email: data.email ?? `user${n}@test.local`,
      isPlatformAdmin: data.isPlatformAdmin ?? false,
    },
  })
}

export const createMembership = (
  userId: string,
  barbershopId: string,
  role: MemberRole,
) => prisma.membership.create({ data: { userId, barbershopId, role } })

export const createService = (
  barbershopId: string,
  data: { name?: string; price?: number; durationInMinutes?: number } = {},
) => {
  const n = next()
  return prisma.barbershopService.create({
    data: {
      barbershopId,
      name: data.name ?? `Serviço ${n}`,
      description: "Serviço de teste",
      price: data.price ?? 50,
      imageUrl: "https://utfs.io/f/test.png",
      durationInMinutes: data.durationInMinutes ?? 30,
    },
  })
}

// Creates the Employee profile plus its EMPLOYEE membership in the shop
export const createEmployee = async (
  userId: string,
  barbershopId: string,
  serviceIds: string[] = [],
) => {
  await prisma.membership.upsert({
    where: { userId_barbershopId: { userId, barbershopId } },
    update: {},
    create: { userId, barbershopId, role: "EMPLOYEE" },
  })

  return prisma.employee.create({
    data: {
      userId,
      barbershopId,
      services: {
        create: serviceIds.map((serviceId) => ({ serviceId })),
      },
    },
  })
}
