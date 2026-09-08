"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"
import { createEmployeeSchema } from "../_lib/validations/employee"

export const createEmployee = async (input: {
  name: string
  email: string
  bio?: string
  imageUrl?: string
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

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: "EMPLOYEE",
      employee: {
        create: {
          bio: parsed.data.bio || null,
          imageUrl: parsed.data.imageUrl || null,
        },
      },
    },
  })

  revalidatePath("/admin/employees")
  revalidatePath("/")
}
