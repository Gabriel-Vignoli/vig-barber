"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
import { EmployeeStat } from "../_actions/get-dashboard-stats"

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

interface AdminEmployeesComparisonChartProps {
  employeeStats: EmployeeStat[]
  rangeLabel: string
}

const AdminEmployeesComparisonChart = ({
  employeeStats,
  rangeLabel,
}: AdminEmployeesComparisonChartProps) => {
  const chartData = employeeStats.map((employee) => ({
    name: employee.employeeName.split(" ")[0],
    bookings: employee.bookings,
    revenue: employee.revenue,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo por funcionário</CardTitle>
        <CardDescription>
          Agendamentos e faturamento — {rangeLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            Nenhum agendamento nesse período.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => currency(value)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      name === "revenue"
                        ? currency(Number(value))
                        : String(value),
                      name === "revenue" ? " Faturamento" : " Agendamentos",
                    ]}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                yAxisId="left"
                dataKey="bookings"
                fill="var(--color-bookings)"
                radius={4}
              />
              <Bar
                yAxisId="right"
                dataKey="revenue"
                fill="var(--color-revenue)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

export default AdminEmployeesComparisonChart
