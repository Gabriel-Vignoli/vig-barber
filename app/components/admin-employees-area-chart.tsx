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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart"
import { getEmployeesOverview } from "../_actions/get-employees-overview"
import { parseDateKey } from "../_lib/timezone"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const AdminEmployeesAreaChart = () => {
  const [data, setData] = useState<Record<string, string | number>[]>([])
  const [employeeNames, setEmployeeNames] = useState<string[]>([])

  useEffect(() => {
    const fetch = async () => {
      const result = await getEmployeesOverview()
      setData(result.data)
      setEmployeeNames(result.employeeNames)
    }
    fetch()
  }, [])

  const employeeTotals = employeeNames
    .map((name, index) => ({
      name,
      total: data.reduce((sum, day) => sum + (Number(day[name]) || 0), 0),
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .sort((a, b) => b.total - a.total)

  const chartConfig = employeeNames.reduce((config, name, index) => {
    config[name] = {
      label: name,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }
    return config
  }, {} as ChartConfig)

  const monthLabel = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Agendamentos concluídos por funcionário</CardTitle>
          <CardDescription className="capitalize">{monthLabel}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {employeeNames.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            Nenhum funcionário cadastrado.
          </p>
        ) : (
          <>
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
                  minTickGap={20}
                  tickFormatter={(value) =>
                    format(parseDateKey(value), "dd/MM", { locale: ptBR })
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) =>
                        format(parseDateKey(value), "dd 'de' MMMM", {
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
              </AreaChart>
            </ChartContainer>

            <div className="mt-4 space-y-2 pb-4">
              {employeeTotals.map((employee, index) => (
                <div
                  key={employee.name}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-4 text-xs font-medium">
                      {index + 1}º
                    </span>
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: employee.color }}
                    />
                    <span className="text-sm font-medium">{employee.name}</span>
                  </div>
                  <span className="text-muted-foreground text-sm font-semibold">
                    {employee.total}{" "}
                    {employee.total === 1 ? "agendamento" : "agendamentos"}
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

export default AdminEmployeesAreaChart
