import type { ReactNode } from "react"
import Link from "next/link"
import { Checkbox } from "./ui/checkbox"
import { Label } from "./ui/label"

// Opens in a new tab so a half-filled form is not lost
export const LegalLink = ({
  href,
  children,
}: {
  href: "/terms" | "/privacy-policy" | "/refund"
  children: ReactNode
}) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener"
    className="text-primary font-semibold underline underline-offset-2"
  >
    {children}
  </Link>
)

interface TermsCheckboxProps {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  children: ReactNode
}

export const TermsCheckbox = ({
  id,
  checked,
  onCheckedChange,
  children,
}: TermsCheckboxProps) => (
  <div className="flex items-start gap-2 text-left">
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={(value: boolean | "indeterminate") =>
        onCheckedChange(value === true)
      }
    />
    <Label
      htmlFor={id}
      className="text-muted-foreground block text-xs leading-snug font-normal xl:text-sm"
    >
      {children}
    </Label>
  </div>
)

// Google creates the account right after its own screen, with no form of ours
// in between, so this notice is the only place to show the terms first.
export const GoogleConsentNotice = () => (
  <p className="text-muted-foreground text-center text-xs leading-snug">
    Ao continuar com o Google, você concorda com os{" "}
    <LegalLink href="/terms">Termos de Uso</LegalLink> e a{" "}
    <LegalLink href="/privacy-policy">Política de Privacidade</LegalLink>.
  </p>
)
