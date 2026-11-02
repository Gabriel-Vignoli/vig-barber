import type { Metadata } from "next"
import { requireShopRole } from "@/app/_lib/tenant"
import { getBillingState, type BillingState } from "@/app/_lib/billing"
import { DEFAULT_PLAN, getPlanConfig, PLANS } from "@/app/_lib/plans"
import { formatBrazilDate } from "@/app/_lib/timezone"
import { Badge } from "@/app/components/ui/badge"
import { Card, CardContent } from "@/app/components/ui/card"

export const metadata: Metadata = {
  title: "Assinatura",
}

interface BillingPageProps {
  params: Promise<{ slug: string }>
}

const getStatusLabel = (state: BillingState) => {
  switch (state.reason) {
    case "TRIALING":
      return "Teste grátis"
    case "ACTIVE":
      return "Ativa"
    case "PAST_DUE_GRACE":
      return "Pagamento pendente"
    case "PAST_DUE_EXPIRED":
      return "Pagamento não realizado"
    case "TRIAL_ENDED":
      return "Teste encerrado"
    case "CANCELED":
      return "Cancelada"
  }
}

const getStatusDetail = (state: BillingState) => {
  switch (state.reason) {
    case "TRIALING": {
      const days = state.trialDaysLeft ?? 0
      return `Seu teste grátis termina em ${days} ${days === 1 ? "dia" : "dias"}.`
    }
    case "ACTIVE":
      return "Sua assinatura está em dia."
    case "PAST_DUE_GRACE":
      return state.graceEndsAt
        ? `O último pagamento falhou. Regularize até ${formatBrazilDate(state.graceEndsAt)} para não perder o acesso.`
        : "O último pagamento falhou."
    case "PAST_DUE_EXPIRED":
    case "TRIAL_ENDED":
    case "CANCELED":
      return "O painel e os agendamentos da barbearia estão bloqueados até a assinatura ser regularizada. Seus dados continuam guardados."
  }
}

// Placeholder until B3 (Checkout + Customer Portal). ADMIN only, and the one
// admin page an unpaid shop can still open.
const BillingPage = async ({ params }: BillingPageProps) => {
  const { slug } = await params
  const { shop } = await requireShopRole(slug, ["ADMIN"], {
    allowUnpaid: true,
  })

  const state = getBillingState(shop, new Date())
  const plan = getPlanConfig(shop.plan) ?? PLANS[DEFAULT_PLAN]

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-xl font-bold lg:text-2xl xl:text-3xl">
          Assinatura
        </h1>
        <p className="text-muted-foreground text-sm xl:text-base">
          Plano e situação do pagamento da {shop.name}.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Plano
              </p>
              <p className="text-lg font-bold">{plan.name}</p>
              <p className="text-muted-foreground text-sm">{plan.priceLabel}</p>
            </div>

            <Badge variant={state.hasAccess ? "secondary" : "destructive"}>
              {getStatusLabel(state)}
            </Badge>
          </div>

          <p className="text-sm">{getStatusDetail(state)}</p>

          <p className="text-muted-foreground border-t pt-4 text-sm">
            O pagamento online da assinatura chega em breve. Enquanto isso, fale
            com a equipe Vig Barber para regularizar.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default BillingPage
