import Image from "next/image"
import Link from "next/link"
import { MailIcon } from "lucide-react"
import type { PlatformContact } from "../_lib/platform-contact"
import { cn } from "../_lib/utils"
import { buttonVariants } from "./ui/button"

interface LandingContactCtaProps {
  contact: PlatformContact
  className?: string
}

// Contact buttons for shop owners. Renders nothing when no contact is set
// (CONTACT_EMAIL / CONTACT_WHATSAPP), so the page never shows a dead link.
const LandingContactCta = ({ contact, className }: LandingContactCtaProps) => {
  if (!contact.emailHref && !contact.whatsappHref) return null

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row", className)}>
      {contact.whatsappHref && (
        <Link
          href={contact.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 text-base")}
        >
          <Image src="/whatsapp.svg" alt="" width={18} height={18} />
          Falar no WhatsApp
        </Link>
      )}

      {contact.emailHref && (
        <Link
          href={contact.emailHref}
          className={cn(
            buttonVariants({
              size: "lg",
              variant: contact.whatsappHref ? "outline" : "default",
            }),
            "h-11 px-5 text-base",
          )}
        >
          <MailIcon />
          Enviar e-mail
        </Link>
      )}
    </div>
  )
}

export default LandingContactCta
