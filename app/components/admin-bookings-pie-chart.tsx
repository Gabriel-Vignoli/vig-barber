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
  ChartLegend,
  ChartLegendContent,
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
  const chartData = serviceStats.map((service, index) => ({
    name: service.serviceName,
    bookings: service.bookings,
    fill: COLORS[index % COLORS.length],
  }))

  const chartConfig = serviceStats.reduce((config, service, index) => {
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
              <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="flex-wrap gap-2"
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

export default AdminBookingsPieChart
