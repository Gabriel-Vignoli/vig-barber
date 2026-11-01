"use server"

import { validateResetCode } from "../_lib/reset-code"
import { verifyCodeSchema } from "../_lib/validations/password-reset"
import { action, ActionError } from "../_lib/action-result"

export const verifyResetCode = action(
  async (input: { email: string; code: string }) => {
    const parsed = verifyCodeSchema.safeParse(input)

    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0].message)
    }

    await validateResetCode(parsed.data.email, parsed.data.code)
  },
)
