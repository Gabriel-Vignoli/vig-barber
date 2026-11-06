"use server"

import bcrypt from "bcryptjs"
import { prisma } from "../_lib/prisma"
import { signUpSchema } from "../_lib/validations/auth"
import { action, ActionError } from "../_lib/action-result"
import { LEGAL_VERSION } from "../_constants/legal-entity"
import { findUserByEmail } from "../_lib/invitation"
import { assertRateLimit, getClientIp } from "../_lib/rate-limit"

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

  if (input.acceptTerms !== true) {
    throw new ActionError(
      "Você precisa aceitar os termos de uso e a política de privacidade.",
    )
  }

  const { name, email, password } = parsed.data

  await assertRateLimit("sign-up-ip", await getClientIp(), {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  })

  const existingUser = await findUserByEmail(email)

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
      consents: { create: { context: "SIGN_UP", version: LEGAL_VERSION } },
    },
  })
})
