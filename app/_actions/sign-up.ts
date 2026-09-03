"use server"

import bcrypt from "bcryptjs"
import { prisma } from "../_lib/prisma"
import { signUpSchema } from "../_lib/validations/auth"

interface SignUpInput {
  name: string
  email: string
  password: string
  acceptTerms: boolean
}

export const signUp = async (input: SignUpInput) => {
  const parsed = signUpSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  if (!input.acceptTerms) {
    throw new Error("Você precisa aceitar a política de privacidade.")
  }

  const { name, email, password } = parsed.data

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
      acceptedTermsAt: new Date(),
    },
  })
}
