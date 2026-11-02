import Link from "next/link"
import { AlertTriangleIcon, ClockIcon } from "lucide-react"
import type { BillingState } from "../_lib/billing"
import { formatBrazilDate } from "../_lib/timezone"
import { cn } from "../_lib/utils"

interface BillingBannerProps {
  billingPath: string
  state: BillingState
}

// Admin-only strip above the admin pages: a subtle note during the trial and
// a warning during the grace period after a failed payment. Nothing when the
// subscription is active (or when the shop is blocked: the pages already
// redirect to the billing page then).
const BillingBanner = ({ billingPath, state }: BillingBannerProps) => {
  if (state.reason === "TRIALING" && state.trialDaysLeft !== undefined) {
    const days = state.trialDaysLeft

    return (
      <Banner
        href={billingPath}
        tone="info"
        icon={<ClockIcon size={16} className="shrink-0" />}
        message={`Seu teste grátis termina em ${days} ${days === 1 ? "dia" : "dias"}.`}
        linkLabel="Ver assinatura"
      />
    )
  }

  if (state.reason === "PAST_DUE_GRACE" && state.graceEndsAt) {
    return (
      <Banner
        href={billingPath}
        tone="warning"
        icon={<AlertTriangleIcon size={16} className="shrink-0" />}
        message={`Pagamento falhou. Regularize até ${formatBrazilDate(state.graceEndsAt)} para não perder o acesso.`}
        linkLabel="Regularizar"
      />
    )
  }

  return null
}

interface BannerProps {
  href: string
  tone: "info" | "warning"
  icon: React.ReactNode
  message: string
  linkLabel: string
}

const Banner = ({ href, tone, icon, message, linkLabel }: BannerProps) => (
  <div
    role={tone === "warning" ? "alert" : "status"}
    className={cn(
      "border-b px-4 py-2 text-sm md:px-6 lg:px-10 xl:px-32",
      tone === "warning"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "bg-muted/50 text-muted-foreground",
    )}
  >
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="flex items-center gap-2">
        {icon}
        {message}
      </span>
      <Link
        href={href}
        className="font-semibold underline-offset-4 hover:underline"
      >
        {linkLabel}
      </Link>
    </div>
  </div>
)

export default BillingBanner
