"use client"

import { useState } from "react"
import { toast } from "sonner"
import { CreditCardIcon, Loader2Icon, SettingsIcon } from "lucide-react"
import { createCheckoutSession } from "../_actions/create-checkout-session"
import { createPortalSession } from "../_actions/create-portal-session"
import { unwrap } from "../_lib/action-result"
import { Button } from "./ui/button"
import { LegalLink, TermsCheckbox } from "./legal-consent"

interface BillingSubscriptionButtonProps {
  slug: string
  // "subscribe" opens Stripe Checkout, "manage" the Customer Portal
  mode: "subscribe" | "manage"
  variant?: "default" | "outline"
}

// Sends the admin to Stripe. The actions read the shop's Stripe ids on the
// server; this component only knows which of the two flows to start.
const BillingSubscriptionButton = ({
  slug,
  mode,
  variant = "default",
}: BillingSubscriptionButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)

    try {
      const { url } = await unwrap(
        mode === "subscribe"
          ? createCheckoutSession(slug, acceptedTerms)
          : createPortalSession(slug),
      )
      window.location.assign(url)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir o pagamento.",
      )
      setIsLoading(false)
    }
  }

  const Icon = mode === "subscribe" ? CreditCardIcon : SettingsIcon

  const button = (
    <Button
      variant={variant}
      className="cursor-pointer gap-2"
      onClick={handleClick}
      disabled={isLoading || (mode === "subscribe" && !acceptedTerms)}
    >
      {isLoading ? (
        <Loader2Icon size={16} className="animate-spin" />
      ) : (
        <Icon size={16} />
      )}
      {mode === "subscribe" ? "Assinar" : "Gerenciar assinatura"}
    </Button>
  )

  if (mode === "manage") return button

  return (
    <div className="w-full space-y-3">
      <TermsCheckbox
        id="billing-accept-terms"
        checked={acceptedTerms}
        onCheckedChange={setAcceptedTerms}
      >
        Li e aceito os <LegalLink href="/terms">Termos de Uso</LegalLink> e a{" "}
        <LegalLink href="/refund">Política de Reembolso</LegalLink>, incluindo a
        renovação mensal automática no cartão até eu cancelar.
      </TermsCheckbox>
      {button}
    </div>
  )
}

export default BillingSubscriptionButton
