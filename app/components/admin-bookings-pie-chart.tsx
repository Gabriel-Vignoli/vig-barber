"use client"

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
import { ServiceStat } from "../_actions/get-dashboard-stats"

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

interface AdminBookingsPieChartProps {
  serviceStats: ServiceStat[]
  rangeLabel: string
}

const AdminBookingsPieChart = ({
  serviceStats,
  rangeLabel,
}: AdminBookingsPieChartProps) => {
  const sortedStats = [...serviceStats].sort((a, b) => b.bookings - a.bookings)

  const chartData = sortedStats.map((service, index) => ({
    name: service.serviceName,
    bookings: service.bookings,
    fill: COLORS[index % COLORS.length],
  }))

  const chartConfig = sortedStats.reduce((config, service, index) => {
    config[service.serviceName] = {
      label: service.serviceName,
      color: COLORS[index % COLORS.length],
    }
    return config
  }, {} as ChartConfig)

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Agendamentos por serviço</CardTitle>
        <CardDescription>{rangeLabel}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {chartData.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            Nenhum agendamento nesse período.
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
                <Pie data={chartData} dataKey="bookings" nameKey="name" />
              </PieChart>
            </ChartContainer>

            <div className="mt-4 space-y-2 pb-4">
              {chartData.map((service, index) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-4 text-xs font-medium">
                      {index + 1}º
                    </span>
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: service.fill }}
                    />
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <span className="text-muted-foreground text-sm font-semibold">
                    {service.bookings}{" "}
                    {service.bookings === 1 ? "agendamento" : "agendamentos"}
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

export default AdminBookingsPieChart
