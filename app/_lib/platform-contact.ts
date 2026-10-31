// Contact links for the landing page CTA, read from the environment so no
// address is hardcoded. Each one is null when its variable is unset or
// invalid, and the page hides it.
export type PlatformContact = {
  email: string | null
  emailHref: string | null
  whatsappHref: string | null
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MAILTO_SUBJECT = "Quero minha barbearia na Vig Barber"
const WHATSAPP_TEXT = "Olá! Quero colocar minha barbearia na Vig Barber."

export const getPlatformContact = (): PlatformContact => {
  const email = process.env.CONTACT_EMAIL?.trim() ?? ""
  // Keeps only the digits: "+55 (11) 99999-9999" -> "5511999999999"
  const whatsapp = (process.env.CONTACT_WHATSAPP ?? "").replace(/\D/g, "")

  const validEmail = EMAIL_REGEX.test(email) ? email : null
  const validWhatsapp =
    whatsapp.length >= 10 && whatsapp.length <= 15 ? whatsapp : null

  return {
    email: validEmail,
    emailHref: validEmail
      ? `mailto:${validEmail}?subject=${encodeURIComponent(MAILTO_SUBJECT)}`
      : null,
    whatsappHref: validWhatsapp
      ? `https://wa.me/${validWhatsapp}?text=${encodeURIComponent(WHATSAPP_TEXT)}`
      : null,
  }
}
