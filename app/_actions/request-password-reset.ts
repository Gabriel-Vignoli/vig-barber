"use server"

import { randomInt } from "crypto"
import { prisma } from "../_lib/prisma"
import { EMAIL_FROM, resend } from "../_lib/resend"
import { requestResetCodeSchema } from "../_lib/validations/password-reset"
import { action, ActionError } from "../_lib/action-result"
import { hashResetCode } from "../_lib/reset-code"
import { assertRateLimit, getClientIp, isRateLimited } from "../_lib/rate-limit"
import { findAccountByEmail } from "../_lib/email-match"

const CODE_EXPIRY_MINUTES = 15
const QUARTER_HOUR_MS = 15 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

const generateCode = () => randomInt(100000, 1000000).toString()

export const requestPasswordReset = action(async (input: { email: string }) => {
  const parsed = requestResetCodeSchema.safeParse(input)

  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0].message)
  }

  // IP first, so a request already refused never spends the address's quota.
  // Both come before the user lookup and answer the same for unknown emails.
  await assertRateLimit("reset-ip", await getClientIp(), {
    limit: 10,
    windowMs: HOUR_MS,
  })

  // Silent, and before the old code is replaced: otherwise anyone could keep
  // the real owner from resetting their password just by asking repeatedly
  const tooManyForEmail = await isRateLimited(
    "reset-email",
    parsed.data.email,
    {
      limit: 3,
      windowMs: QUARTER_HOUR_MS,
    },
  )

  if (tooManyForEmail) {
    return
  }

  const user = await findAccountByEmail(parsed.data.email)

  if (!user?.email) {
    return
  }

  const email = user.email

  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)

  // Only the newest code stays valid
  await prisma.$transaction([
    prisma.passwordResetCode.updateMany({
      where: { email, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetCode.create({
      data: { email, code: hashResetCode(email, code), expiresAt },
    }),
  ])

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Seu código de redefinição de senha",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Redefinição de senha</h2>
        <p>Use o código abaixo para redefinir sua senha. Ele expira em ${CODE_EXPIRY_MINUTES} minutos.</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</p>
        <p>Se você não solicitou isso, pode ignorar este email.</p>
      </div>
    `,
  })
})
