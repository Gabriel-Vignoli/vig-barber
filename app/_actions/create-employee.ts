"use server"

import bcrypt from "bcryptjs"
import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import { createEmployeeSchema } from "../_lib/validations/employee"

export const createEmployee = async (
  slug: string,
  input: {
    name: string
    email: string
    password: string
    bio?: string
    imageUrl?: string
    phone?: string
  },
) => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  const parsed = createEmployeeSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  // TODO(Phase 4b): attach an existing user through a Membership instead
  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  })

  if (existingUser) {
    throw new Error("Já existe um usuário com esse email.")
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10)

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      role: "EMPLOYEE",
      employees: {
        create: {
          barbershopId: shop.id,
          bio: parsed.data.bio || null,
          imageUrl: parsed.data.imageUrl || null,
          phone: parsed.data.phone || null,
        },
      },
      memberships: {
        create: { barbershopId: shop.id, role: "EMPLOYEE" },
      },
    },
  })

  revalidateShop(shop)
}
