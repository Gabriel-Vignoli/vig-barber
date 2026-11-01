"use client"

import { useCallback } from "react"
import { Pie, PieChart } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart"
import { Loader2Icon } from "lucide-react"
import { getExpensesOverview } from "../_actions/get-expenses-overview"
import { useLoad } from "../_hooks/use-load"
import { LoadError } from "./load-error"

const COLORS = [
  "#1e3a8a", // dark blue
  "#3b82f6", // normal blue
  "#93c5fd", // light blue
  "#0c4a6e", // deep navy
  "#38bdf8", // sky blue
  "#1e40af", // indigo-blue
  "#bae6fd", // pale blue
  "#2563eb", // vivid blue
]

const currency = (value: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  )

interface AdminExpensesChartProps {
  slug: string
}

const AdminExpensesChart = ({ slug }: AdminExpensesChartProps) => {
  const load = useCallback(() => getExpensesOverview(slug), [slug])
  const { data, isLoading, hasError, retry } = useLoad(
    load,
    "Erro ao carregar as despesas.",
  )
  const totalExpenses = data?.totalExpenses ?? 0
  const categoryBreakdown = data?.categoryBreakdown ?? []

  const chartData = categoryBreakdown.map((item, index) => ({
    name: item.label,
    total: item.total,
    fill: COLORS[index % COLORS.length],
  }))

  const chartConfig = categoryBreakdown.reduce((config, item, index) => {
    config[item.label] = {
      label: item.label,
      color: COLORS[index % COLORS.length],
    }
    return config
  }, {} as ChartConfig)

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Despesas por categoria</CardTitle>
        <CardDescription>
          Total do mês: {currency(totalExpenses)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {hasError ? (
          <LoadError onRetry={retry} />
        ) : isLoading && !data ? (
          <div className="flex justify-center py-12">
            <Loader2Icon className="size-5 animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            Nenhuma despesa nesse período.
          </p>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[280px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="name" />}
                />
                <Pie data={chartData} dataKey="total" nameKey="name" />
              </PieChart>
            </ChartContainer>

            <div className="mt-4 space-y-2 pb-4">
              {chartData.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-4 text-xs font-medium">
                      {index + 1}º
                    </span>
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-destructive text-sm font-semibold">
                    {currency(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default AdminExpensesChart
