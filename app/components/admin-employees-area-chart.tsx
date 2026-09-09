"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import {
  EmployeesOverviewRange,
  getEmployeesOverview,
} from "./get-employees-overview"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const RANGE_LABELS: Record<EmployeesOverviewRange, string> = {
  "90d": "Últimos 3 meses",
  "30d": "Últimos 30 dias",
  "7d": "Últimos 7 dias",
}

const AdminEmployeesAreaChart = () => {
  const [range, setRange] = useState<EmployeesOverviewRange>("90d")
  const [data, setData] = useState<Record<string, string | number>[]>([])
  const [employeeNames, setEmployeeNames] = useState<string[]>([])

  useEffect(() => {
    const fetch = async () => {
      const result = await getEmployeesOverview(range)
      setData(result.data)
      setEmployeeNames(result.employeeNames)
    }
    fetch()
  }, [range])

  const chartConfig = employeeNames.reduce((config, name, index) => {
    config[name] = {
      label: name,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }
    return config
  }, {} as ChartConfig)

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Agendamentos por funcionário</CardTitle>
          <CardDescription>
            Comparativo de agendamentos ao longo do tempo
          </CardDescription>
        </div>
        <Select
          value={range}
          onValueChange={(value) => setRange(value as EmployeesOverviewRange)}
        >
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Selecione o período"
          >
            <SelectValue placeholder={RANGE_LABELS[range]} />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Últimos 3 meses
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Últimos 30 dias
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Últimos 7 dias
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {employeeNames.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            Nenhum agendamento nesse período.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={data}>
              <defs>
                {employeeNames.map((name, index) => (
                  <linearGradient
                    key={name}
                    id={`fill-${name}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS[index % CHART_COLORS.length]}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS[index % CHART_COLORS.length]}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))}
              </defs>
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
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      format(new Date(value), "dd 'de' MMMM", {
                        locale: ptBR,
                      })
                    }
                    indicator="dot"
                  />
                }
              />
              {employeeNames.map((name, index) => (
                <Area
                  key={name}
                  dataKey={name}
                  type="natural"
                  fill={`url(#fill-${name})`}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  stackId="a"
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

export default AdminEmployeesAreaChart
