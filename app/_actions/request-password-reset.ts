"use server"

import { prisma } from "../_lib/prisma"
import { resend } from "../_lib/resend"
import { requestResetCodeSchema } from "../_lib/validations/password-reset"

const CODE_EXPIRY_MINUTES = 15

const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString()

export const requestPasswordReset = async (input: { email: string }) => {
  const parsed = requestResetCodeSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const { email } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return
  }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)

  await prisma.passwordResetCode.create({
    data: { email, code, expiresAt },
  })

  await resend.emails.send({
    from: "Vig Barber <onboarding@resend.dev>",
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
}
