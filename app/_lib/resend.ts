import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY)

// Emails are sent by the platform, never in the name of a single shop
export const EMAIL_FROM =
  process.env.EMAIL_FROM || "Vig Barber <onboarding@resend.dev>"
