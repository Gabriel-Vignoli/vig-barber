"use client"

import { useEffect, useState, useTransition } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  DollarSignIcon,
  Loader2Icon,
  ScissorsIcon,
} from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Calendar } from "./ui/calendar"
import {
  getDashboardStats,
  DashboardPeriod,
  DashboardStats,
} from "../_actions/get-dashboard-stats"
import AdminEmployeesComparisonChart from "./admin-employees-comparison-chart"
import AdminBookingsPieChart from "./admin-bookings-pie-chart"
import AdminOverviewChart from "./admin-overview-chart"
import AdminEmployeesAreaChart from "./admin-employees-area-chart"

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
]

const currency = (value: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  )

const AdminDashboard = () => {
  const [period, setPeriod] = useState<DashboardPeriod>("day")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const result = await getDashboardStats({ period, date: selectedDate })
      setStats(result)
    })
  }, [period, selectedDate])

  const rangeLabel = stats
    ? period === "day"
      ? format(new Date(stats.rangeStart), "dd 'de' MMMM", { locale: ptBR })
      : `${format(new Date(stats.rangeStart), "dd/MM", { locale: ptBR })} - ${format(
          new Date(stats.rangeEnd),
          "dd/MM",
          { locale: ptBR },
        )}`
    : ""

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant={period === p.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <Popover>
          <PopoverTrigger
            render={(triggerProps) => (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer gap-2"
                {...triggerProps}
              >
                <CalendarIcon size={16} />
                {format(selectedDate, "dd/MM/yyyy")}
              </Button>
            )}
          />
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              locale={ptBR}
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex size-9 items-center justify-center rounded-full">
                <ScissorsIcon size={18} className="text-primary" />
              </div>
              <p className="text-muted-foreground text-xs uppercase">
                Agendamentos — {rangeLabel}
              </p>
            </div>

            {isPending ? (
              <div className="flex justify-center py-4">
                <Loader2Icon className="size-5 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <CheckCircle2Icon size={12} />
                    Concluídos
                  </div>
                  <p className="text-xl font-bold">
                    {stats?.bookingsBreakdown.concluded ?? 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <ClockIcon size={12} />A concluir
                  </div>
                  <p className="text-xl font-bold">
                    {stats?.bookingsBreakdown.upcoming ?? 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="text-primary text-xl font-bold">
                    {stats?.bookingsBreakdown.total ?? 0}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex size-9 items-center justify-center rounded-full">
                <DollarSignIcon size={18} className="text-primary" />
              </div>
              <p className="text-muted-foreground text-xs uppercase">
                Faturamento — {rangeLabel}
              </p>
            </div>

            {isPending ? (
              <div className="flex justify-center py-4">
                <Loader2Icon className="size-5 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <CheckCircle2Icon size={12} />
                    Concluído
                  </div>
                  <p className="text-lg font-bold">
                    {currency(stats?.revenueBreakdown.concluded ?? 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <ClockIcon size={12} />A receber
                  </div>
                  <p className="text-lg font-bold">
                    {currency(stats?.revenueBreakdown.upcoming ?? 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="text-primary text-lg font-bold">
                    {currency(stats?.revenueBreakdown.total ?? 0)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AdminOverviewChart />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminEmployeesAreaChart />
        <AdminBookingsPieChart
          serviceStats={stats?.serviceStats ?? []}
          rangeLabel={rangeLabel}
        />
      </div>
    </div>
  )
}

export default AdminDashboard
