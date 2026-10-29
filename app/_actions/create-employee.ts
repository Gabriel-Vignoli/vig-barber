"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"
import { createEmployeeSchema } from "../_lib/validations/employee"

export const createEmployee = async (input: {
  name: string
  email: string
  password: string
  bio?: string
  imageUrl?: string
  phone?: string
}) => {
  await requireAdmin()

  const parsed = createEmployeeSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  })

  if (existingUser) {
    throw new Error("Já existe um usuário com esse email.")
  }

  // single-shop for now; memberships come in Phase 4b
  const barbershop = await prisma.barbershop.findFirst({
    select: { id: true },
  })
  if (!barbershop) {
    throw new Error("Barbearia não encontrada.")
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
          barbershopId: barbershop.id,
          bio: parsed.data.bio || null,
          imageUrl: parsed.data.imageUrl || null,
          phone: parsed.data.phone || null,
        },
      },
    },
  })

  revalidatePath("/admin/employees")
  revalidatePath("/")
}
