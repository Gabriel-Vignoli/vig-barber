import type { Metadata } from "next"
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react"
import { requireShopRole } from "@/app/_lib/tenant"
import { prisma } from "@/app/_lib/prisma"
import {
  getBillingState,
  hasLiveSubscription,
  type BillingState,
} from "@/app/_lib/billing"
import { DEFAULT_PLAN, getPlanConfig, PLANS } from "@/app/_lib/plans"
import { formatBrazilDate } from "@/app/_lib/timezone"
import { Badge } from "@/app/components/ui/badge"
import { Card, CardContent } from "@/app/components/ui/card"
import BillingSubscriptionButton from "@/app/components/billing-subscription-button"

export const metadata: Metadata = {
  title: "Assinatura",
}

interface BillingPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ checkout?: string }>
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

const getStatusVariant = (state: BillingState) => {
  if (!state.hasAccess) return "destructive"
  return state.reason === "ACTIVE" ? "success" : "secondary"
}

const getStatusDetail = (
  state: BillingState,
  {
    currentPeriodEnd,
    isSubscribed,
  }: { currentPeriodEnd: Date | null; isSubscribed: boolean },
) => {
  switch (state.reason) {
    case "TRIALING": {
      const days = state.trialDaysLeft ?? 0
      const trial = `Seu teste grátis termina em ${days} ${days === 1 ? "dia" : "dias"}.`
      return isSubscribed
        ? `${trial} A primeira cobrança acontece quando ele terminar.`
        : trial
    }
    case "ACTIVE":
      return currentPeriodEnd
        ? `Sua assinatura está em dia. Próxima cobrança em ${formatBrazilDate(currentPeriodEnd, { withYear: true })}.`
        : "Sua assinatura está em dia."
    case "PAST_DUE_GRACE":
      return state.graceEndsAt
        ? `O último pagamento falhou. Atualize o cartão até ${formatBrazilDate(state.graceEndsAt)} para não perder o acesso.`
        : "O último pagamento falhou. Atualize o cartão para não perder o acesso."
    case "CANCELED":
      return "Sua assinatura foi cancelada. O painel e os agendamentos da barbearia estão bloqueados até você assinar de novo. Seus dados continuam guardados."
    case "PAST_DUE_EXPIRED":
    case "TRIAL_ENDED":
      return "O painel e os agendamentos da barbearia estão bloqueados até a assinatura ser regularizada. Seus dados continuam guardados."
  }
}

// ADMIN only, and the one admin page an unpaid shop can still open. The
// Stripe ids are read here and never passed to the client: the button only
// learns which flow to start.
const BillingPage = async ({ params, searchParams }: BillingPageProps) => {
  const { slug } = await params
  const { checkout } = await searchParams
  const { shop } = await requireShopRole(slug, ["ADMIN"], {
    allowUnpaid: true,
  })

  // Read fresh (the tenant object is cached and has no Stripe ids)
  const billing = await prisma.barbershop.findUnique({
    where: { id: shop.id },
    select: {
      subscriptionStatus: true,
      trialEndsAt: true,
      pastDueSince: true,
      currentPeriodEnd: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  })
  const billingShop = billing ?? shop

  const state = getBillingState(billingShop, new Date())
  const plan = getPlanConfig(shop.plan) ?? PLANS[DEFAULT_PLAN]
  const isSubscribed = billing ? hasLiveSubscription(billing) : false
  const canManage = Boolean(
    billing?.stripeCustomerId && billing?.stripeSubscriptionId,
  )

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

      {checkout === "success" && <CheckoutSuccessNotice done={isSubscribed} />}
      {checkout === "cancel" && !isSubscribed && (
        <Notice icon={<XCircleIcon size={18} className="shrink-0" />}>
          Pagamento cancelado. Nenhuma cobrança foi feita.
        </Notice>
      )}

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

            <Badge variant={getStatusVariant(state)}>
              {getStatusLabel(state)}
            </Badge>
          </div>

          <p className="text-sm">
            {getStatusDetail(state, {
              currentPeriodEnd: billing?.currentPeriodEnd ?? null,
              isSubscribed,
            })}
          </p>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center">
            {/* Right after checkout the webhook may not have landed yet;
                hiding "Assinar" avoids a second subscription */}
            {!isSubscribed && checkout !== "success" && (
              <BillingSubscriptionButton slug={slug} mode="subscribe" />
            )}
            {canManage && (
              <BillingSubscriptionButton
                slug={slug}
                mode="manage"
                variant={isSubscribed ? "default" : "outline"}
              />
            )}
          </div>

          <p className="text-muted-foreground text-xs">
            {isSubscribed
              ? "Troque o cartão, veja as faturas ou cancele no portal seguro da Stripe."
              : "Pagamento por cartão de crédito, processado com segurança pela Stripe."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

const CheckoutSuccessNotice = ({ done }: { done: boolean }) =>
  done ? (
    <Notice
      tone="success"
      icon={<CheckCircle2Icon size={18} className="shrink-0" />}
    >
      Assinatura confirmada. Obrigado!
    </Notice>
  ) : (
    <Notice
      tone="success"
      icon={<Loader2Icon size={18} className="shrink-0 animate-spin" />}
    >
      Pagamento recebido! Estamos confirmando sua assinatura… Atualize a página
      em alguns instantes.
    </Notice>
  )

interface NoticeProps {
  tone?: "success" | "muted"
  icon: React.ReactNode
  children: React.ReactNode
}

const Notice = ({ tone = "muted", icon, children }: NoticeProps) => (
  <div
    role="status"
    className={
      tone === "success"
        ? "flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400"
        : "bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-lg border p-4 text-sm"
    }
  >
    {icon}
    <span>{children}</span>
  </div>
)

export default BillingPage
