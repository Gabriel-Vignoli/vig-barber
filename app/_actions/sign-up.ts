"use server"

import bcrypt from "bcryptjs"
import { prisma } from "../_lib/prisma"
import { signUpSchema } from "../_lib/validations/auth"
import { action, ActionError } from "../_lib/action-result"

interface SignUpInput {
  name: string
  email: string
  password: string
  acceptTerms: boolean
}

export const signUp = action(async (input: SignUpInput) => {
  const parsed = signUpSchema.safeParse(input)

  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0].message)
  }

  if (!input.acceptTerms) {
    throw new ActionError("Você precisa aceitar a política de privacidade.")
  }

  const { name, email, password } = parsed.data

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new ActionError("Já existe uma conta com esse email.")
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
})
