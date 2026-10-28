"use server"

import { validateResetCode } from "../_lib/reset-code"
import { verifyCodeSchema } from "../_lib/validations/password-reset"

export const verifyResetCode = async (input: {
  email: string
  code: string
}) => {
  const parsed = verifyCodeSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  await validateResetCode(parsed.data.email, parsed.data.code)
}
