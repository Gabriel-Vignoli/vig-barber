"use client"

import { useState } from "react"
import { toast } from "sonner"
import { BarChart3Icon, Loader2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { getEmployeeStats, StatsPeriod } from "../_actions/get-employee-stats"

const PERIODS: { value: StatsPeriod; label: string }[] = [
  { value: "day", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
]

interface EmployeeStatsDialogProps {
  employeeId: string
  employeeName: string
}

const EmployeeStatsDialog = ({
  employeeId,
  employeeName,
}: EmployeeStatsDialogProps) => {
  const [open, setOpen] = useState(false)
  const [period, setPeriod] = useState<StatsPeriod>("day")
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<{
    totalBookings: number
    totalRevenue: number
  } | null>(null)

  const fetchStats = async (selectedPeriod: StatsPeriod) => {
    setIsLoading(true)
    setPeriod(selectedPeriod)

    try {
      const result = await getEmployeeStats(employeeId, selectedPeriod)
      setStats(result)
    } catch (error) {
      toast.error("Erro ao carregar estatísticas.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) fetchStats("day")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={(triggerProps) => (
          <Button
            size="icon"
            variant="ghost"
            className="cursor-pointer"
            {...triggerProps}
          >
            <BarChart3Icon size={16} />
          </Button>
        )}
      />
      <DialogContent className="w-[90%] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Estatísticas</DialogTitle>
          <DialogDescription>
            Agendamentos e faturamento de {employeeName}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant={period === p.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => fetchStats(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2Icon className="size-6 animate-spin" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
                <p className="text-muted-foreground text-xs">Agendamentos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-primary text-2xl font-bold">
                  {Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(stats.totalRevenue)}
                </p>
                <p className="text-muted-foreground text-xs">Faturamento</p>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default EmployeeStatsDialog
