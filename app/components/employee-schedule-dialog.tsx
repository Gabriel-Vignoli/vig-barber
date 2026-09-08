"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CalendarClockIcon, Loader2Icon } from "lucide-react"
import { Weekday } from "@prisma/client"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Checkbox } from "./ui/checkbox"
import { Label } from "./ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { updateEmployeeSchedule } from "../_actions/update-employee-schedule"

const WEEKDAY_ORDER: Weekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]

const WEEKDAY_LABELS: Record<Weekday, string> = {
  MONDAY: "Segunda",
  TUESDAY: "Terça",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
}

interface ExistingSchedule {
  weekday: Weekday
  startTime: string
  endTime: string
  isDayOff: boolean
}

interface EmployeeScheduleDialogProps {
  employeeId: string
  currentSchedules: ExistingSchedule[]
}

const buildInitialState = (currentSchedules: ExistingSchedule[]) => {
  return WEEKDAY_ORDER.map((weekday) => {
    const existing = currentSchedules.find((s) => s.weekday === weekday)
    return (
      existing ?? {
        weekday,
        startTime: "09:00",
        endTime: "18:00",
        isDayOff: false,
      }
    )
  })
}

const EmployeeScheduleDialog = ({
  employeeId,
  currentSchedules,
}: EmployeeScheduleDialogProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [schedules, setSchedules] = useState(
    buildInitialState(currentSchedules),
  )

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) setSchedules(buildInitialState(currentSchedules))
  }

  const updateDay = (
    index: number,
    field: "startTime" | "endTime" | "isDayOff",
    value: string | boolean,
  ) => {
    setSchedules((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    )
  }

  const handleSave = async () => {
    setIsSubmitting(true)

    try {
      await updateEmployeeSchedule(employeeId, schedules)
      toast.success("Horários atualizados com sucesso!")
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar horários.",
      )
    } finally {
      setIsSubmitting(false)
    }
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
            <CalendarClockIcon size={16} />
          </Button>
        )}
      />
      <DialogContent className="w-[90%] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Horários de trabalho</DialogTitle>
          <DialogDescription>
            Defina os horários de atendimento por dia da semana.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 space-y-3 overflow-y-auto">
          {schedules.map((schedule, index) => (
            <div
              key={schedule.weekday}
              className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`dayoff-${schedule.weekday}`}
                  checked={schedule.isDayOff}
                  onCheckedChange={(checked) =>
                    updateDay(index, "isDayOff", checked === true)
                  }
                />
                <Label htmlFor={`dayoff-${schedule.weekday}`} className="w-20">
                  {WEEKDAY_LABELS[schedule.weekday]}
                </Label>
              </div>

              {!schedule.isDayOff && (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) =>
                      updateDay(index, "startTime", e.target.value)
                    }
                    className="w-28"
                  />
                  <span className="text-muted-foreground text-sm">até</span>
                  <Input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) =>
                      updateDay(index, "endTime", e.target.value)
                    }
                    className="w-28"
                  />
                </div>
              )}

              {schedule.isDayOff && (
                <span className="text-muted-foreground text-sm">Fechado</span>
              )}
            </div>
          ))}
        </div>

        <Button
          className="w-full cursor-pointer py-5"
          disabled={isSubmitting}
          onClick={handleSave}
        >
          {isSubmitting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            "Salvar"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default EmployeeScheduleDialog
