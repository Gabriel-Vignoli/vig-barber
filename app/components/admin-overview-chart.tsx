"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
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
import {
  getBarbershopOverview,
  OverviewDataPoint,
  OverviewRange,
} from "../_actions/get-barbershop-overwiew"

const chartConfig = {
  bookings: {
    label: "Agendamentos",
    color: "var(--chart-1)",
  },
  revenue: {
    label: "Faturamento",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const currency = (value: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  )

const RANGE_OPTIONS: { value: OverviewRange; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
]

const AdminOverviewChart = () => {
  const [range, setRange] = useState<OverviewRange>("30d")
  const [activeMetric, setActiveMetric] =
    useState<keyof typeof chartConfig>("bookings")
  const [data, setData] = useState<OverviewDataPoint[]>([])

  useEffect(() => {
    const fetch = async () => {
      const result = await getBarbershopOverview(range)
      setData(result)
    }
    fetch()
  }, [range])

  const totals = data.reduce(
    (acc, point) => ({
      bookings: acc.bookings + point.bookings,
      revenue: acc.revenue + point.revenue,
    }),
    { bookings: 0, revenue: 0 },
  )

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle>Visão geral da barbearia</CardTitle>
          <CardDescription>Total de agendamentos e faturamento</CardDescription>
        </div>
        <div className="flex">
          {(["bookings", "revenue"] as const).map((key) => (
            <button
              key={key}
              data-active={activeMetric === key}
              className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
              onClick={() => setActiveMetric(key)}
            >
              <span className="text-muted-foreground text-xs">
                {chartConfig[key].label}
              </span>
              <span className="text-lg leading-none font-bold sm:text-3xl">
                {key === "revenue"
                  ? currency(totals.revenue)
                  : totals.bookings.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <div className="mb-4 flex justify-end gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setRange(option.value)}
              className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium ${
                range === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                format(new Date(value), "dd/MM", { locale: ptBR })
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[160px]"
                  labelFormatter={(value) =>
                    format(new Date(value), "dd 'de' MMMM", { locale: ptBR })
                  }
                  formatter={(value) =>
                    activeMetric === "revenue"
                      ? currency(Number(value))
                      : String(value)
                  }
                />
              }
            />
            <Bar dataKey={activeMetric} fill={`var(--color-${activeMetric})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default AdminOverviewChart
