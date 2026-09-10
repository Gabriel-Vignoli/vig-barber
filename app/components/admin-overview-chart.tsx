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
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "./ui/chart"
import {
  getMonthlyOverview,
  MonthlyOverviewDataPoint,
} from "../_actions/get-monthly-overview"
import { parseDateKey } from "../_lib/timezone"

const bookingsChartConfig = {
  concludedBookings: {
    label: "Concluídos",
    color: "var(--chart-1)",
  },
  upcomingBookings: {
    label: "A concluir",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const revenueChartConfig = {
  concludedRevenue: {
    label: "Concluído",
    color: "var(--chart-1)",
  },
  upcomingRevenue: {
    label: "A receber",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const currency = (value: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  )

const AdminOverviewChart = () => {
  const [activeMetric, setActiveMetric] = useState<"bookings" | "revenue">(
    "bookings",
  )
  const [data, setData] = useState<MonthlyOverviewDataPoint[]>([])
  const [totals, setTotals] = useState({
    totalConcludedBookings: 0,
    totalConcludedRevenue: 0,
  })

  useEffect(() => {
    const fetch = async () => {
      const result = await getMonthlyOverview()
      setData(result.data)
      setTotals({
        totalConcludedBookings: result.totalConcludedBookings,
        totalConcludedRevenue: result.totalConcludedRevenue,
      })
    }
    fetch()
  }, [])

  const chartConfig =
    activeMetric === "bookings" ? bookingsChartConfig : revenueChartConfig

  const monthLabel = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle>Visão geral da barbearia</CardTitle>
          <CardDescription className="capitalize">{monthLabel}</CardDescription>
        </div>
        <div className="flex">
          <button
            data-active={activeMetric === "bookings"}
            className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
            onClick={() => setActiveMetric("bookings")}
          >
            <span className="text-muted-foreground text-xs">
              Agendamentos concluídos
            </span>
            <span className="text-lg leading-none font-bold sm:text-3xl">
              {totals.totalConcludedBookings.toLocaleString()}
            </span>
          </button>
          <button
            data-active={activeMetric === "revenue"}
            className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
            onClick={() => setActiveMetric("revenue")}
          >
            <span className="text-muted-foreground text-xs">
              Faturamento concluído
            </span>
            <span className="text-lg leading-none font-bold sm:text-3xl">
              {currency(totals.totalConcludedRevenue)}
            </span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:p-6">
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
              minTickGap={20}
              tickFormatter={(value) =>
                format(parseDateKey(value), "dd/MM", { locale: ptBR })
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[180px]"
                  labelFormatter={(value) =>
                    format(parseDateKey(value), "dd 'de' MMMM", {
                      locale: ptBR,
                    })
                  }
                  formatter={(value, name) => {
                    const label =
                      name === "concludedBookings"
                        ? "Concluídos"
                        : name === "upcomingBookings"
                          ? "A concluir"
                          : name === "concludedRevenue"
                            ? "Concluído"
                            : name === "upcomingRevenue"
                              ? "A receber"
                              : String(name)

                    const displayValue =
                      activeMetric === "revenue"
                        ? currency(Number(value))
                        : String(value)

                    return [`${displayValue} `, label]
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {activeMetric === "bookings" ? (
              <>
                <Bar
                  dataKey="concludedBookings"
                  stackId="a"
                  fill="var(--color-concludedBookings)"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="upcomingBookings"
                  stackId="a"
                  fill="var(--color-upcomingBookings)"
                  radius={[4, 4, 0, 0]}
                />
              </>
            ) : (
              <>
                <Bar
                  dataKey="concludedRevenue"
                  stackId="a"
                  fill="var(--color-concludedRevenue)"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="upcomingRevenue"
                  stackId="a"
                  fill="var(--color-upcomingRevenue)"
                  radius={[4, 4, 0, 0]}
                />
              </>
            )}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default AdminOverviewChart
