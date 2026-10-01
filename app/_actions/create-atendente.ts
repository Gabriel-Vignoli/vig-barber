"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"
import { createAtendenteSchema } from "../_lib/validations/atendente"

export const createAtendente = async (input: {
  name: string
  email: string
  password: string
}) => {
  await requireAdmin()

  const parsed = createAtendenteSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
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
    },
  })

  revalidatePath("/admin/employees")
}
