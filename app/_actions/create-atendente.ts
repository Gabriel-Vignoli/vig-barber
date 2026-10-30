"use server"

import bcrypt from "bcryptjs"
import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import { createAtendenteSchema } from "../_lib/validations/atendente"

export const createAtendente = async (
  slug: string,
  input: {
    name: string
    email: string
    password: string
  },
) => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  const parsed = createAtendenteSchema.safeParse(input)

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
      role: "ATENDENTE",
      memberships: {
        create: { barbershopId: shop.id, role: "ATENDENTE" },
      },
    },
  })

  revalidateShop(shop)
}
