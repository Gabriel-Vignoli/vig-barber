"use server"

import bcrypt from "bcryptjs"
import { prisma } from "../_lib/prisma"

interface SignUpInput {
  name: string
  email: string
  password: string
}

export const signUp = async ({ name, email, password }: SignUpInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error("Já existe uma conta com esse email.")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  })
}
