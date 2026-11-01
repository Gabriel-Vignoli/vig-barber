"use client"

import { useCallback } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Loader2Icon,
  ReceiptIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { getNetProfit } from "../_actions/get-net-profit"
import { useLoad } from "../_hooks/use-load"
import { LoadError } from "./load-error"

const currency = (value: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  )

interface AdminNetProfitCardProps {
  slug: string
}

const AdminNetProfitCard = ({ slug }: AdminNetProfitCardProps) => {
  const load = useCallback(() => getNetProfit(slug), [slug])
  const { data, isLoading, hasError, retry } = useLoad(
    load,
    "Erro ao carregar o lucro líquido.",
  )

  const monthLabel = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })
  const isPositive = (data?.netProfit ?? 0) >= 0

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col space-y-4 p-4 lg:p-6">
        <div className="flex items-center gap-2">
          <div
            className={`flex size-9 items-center justify-center rounded-full ${
              isPositive ? "bg-primary/10" : "bg-destructive/10"
            }`}
          >
            {isPositive ? (
              <TrendingUpIcon size={18} className="text-primary" />
            ) : (
              <TrendingDownIcon size={18} className="text-destructive" />
            )}
          </div>
          <p className="text-muted-foreground text-xs uppercase">
            Lucro líquido — <span className="capitalize">{monthLabel}</span>
          </p>
        </div>

        {hasError ? (
          <LoadError onRetry={retry} />
        ) : isLoading ? (
          <div className="flex flex-1 items-center justify-center py-4">
            <Loader2Icon className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 space-y-3">
            <p
              className={`text-3xl font-bold lg:text-4xl ${
                isPositive ? "text-primary" : "text-destructive"
              }`}
            >
              {currency(data?.netProfit ?? 0)}
            </p>

            <div className="space-y-2 border-t pt-3">
              <div className="text-muted-foreground flex items-center justify-between text-sm">
                <span>Agendamentos concluídos até agora</span>
                <span className="text-primary font-semibold">
                  {currency(data?.concludedRevenue ?? 0)}
                </span>
              </div>
              <div className="text-muted-foreground flex items-center justify-between text-sm">
                <span>Total de despesas no mês</span>
                <span className="text-destructive font-semibold">
                  {currency(data?.totalExpenses ?? 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="mt-auto w-full cursor-pointer gap-2 p-4 lg:p-5 xl:text-base"
          nativeButton={false}
          render={(buttonProps) => (
            <Link href={`/b/${slug}/admin/expenses`} {...buttonProps}>
              <ReceiptIcon size={16} />
              Ver despesas
            </Link>
          )}
        />
      </CardContent>
    </Card>
  )
}

export default AdminNetProfitCard
