"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import { format, set } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent } from "./ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { Calendar } from "./ui/calendar"
import { getEmployeesForService } from "../_actions/get-employees-for-service"
import { getBookings } from "../_actions/get-bookings"
import {
  getEmployeeSchedule,
  EmployeeScheduleResult,
} from "../_actions/get-employee-schedule"
import { createWalkInBooking } from "../_actions/create-walkin-booking"
import { getTimeList } from "../_lib/time-list"

interface Service {
  id: string
  name: string
  price: number
  durationInMinutes: number
}

interface EmployeeOption {
  id: string
  name: string
  imageUrl: string
}

interface WalkInBookingFormProps {
  services: Service[]
}

const WalkInBookingForm = ({ services }: WalkInBookingFormProps) => {
  const router = useRouter()

  const [selectedServiceId, setSelectedServiceId] = useState<
    string | undefined
  >(undefined)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<
    string | undefined
  >(undefined)
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  )
  const [dayBookings, setDayBookings] = useState<
    Awaited<ReturnType<typeof getBookings>>
  >([])
  const [daySchedule, setDaySchedule] = useState<EmployeeScheduleResult>(null)

  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedService = services.find((s) => s.id === selectedServiceId)

  useEffect(() => {
    if (!selectedServiceId) return

    const fetchEmployees = async () => {
      const result = await getEmployeesForService(selectedServiceId)
      setEmployees(result)
    }
    fetchEmployees()
  }, [selectedServiceId])

  useEffect(() => {
    const fetch = async () => {
      if (!selectedDay || !selectedEmployeeId) return
      const [bookings, schedule] = await Promise.all([
        getBookings({ date: selectedDay, employeeId: selectedEmployeeId }),
        getEmployeeSchedule(selectedEmployeeId, selectedDay),
      ])
      setDayBookings(bookings)
      setDaySchedule(schedule)
    }
    fetch()
  }, [selectedDay, selectedEmployeeId])

  const availableTimes = useMemo(() => {
    if (!selectedDay || !selectedService) return []
    return getTimeList(
      dayBookings,
      selectedDay,
      selectedService.durationInMinutes,
      daySchedule,
    )
  }, [dayBookings, selectedDay, selectedService, daySchedule])

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    setSelectedEmployeeId(undefined)
    setSelectedDay(undefined)
    setSelectedTime(undefined)
  }

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId)
    setSelectedDay(undefined)
    setSelectedTime(undefined)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDay(date)
    setSelectedTime(undefined)
  }

  const handleSubmit = async () => {
    if (
      !selectedServiceId ||
      !selectedEmployeeId ||
      !selectedDay ||
      !selectedTime ||
      !clientName.trim()
    ) {
      toast.error("Preencha todos os campos obrigatórios.")
      return
    }

    setIsSubmitting(true)

    try {
      const hour = Number(selectedTime.split(":")[0])
      const minute = Number(selectedTime.split(":")[1])
      const bookingDate = set(selectedDay, { hours: hour, minutes: minute })

      await createWalkInBooking({
        employeeId: selectedEmployeeId,
        barbershopServiceId: selectedServiceId,
        bookingDate,
        clientName,
        clientPhone: clientPhone || undefined,
      })

      toast.success("Agendamento criado com sucesso!")
      setSelectedServiceId(undefined)
      setSelectedEmployeeId(undefined)
      setSelectedDay(undefined)
      setSelectedTime(undefined)
      setClientName("")
      setClientPhone("")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar agendamento.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Serviço</Label>
        <div className="flex flex-wrap gap-2">
          {services.map((service) => (
            <Button
              key={service.id}
              type="button"
              variant={selectedServiceId === service.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleServiceSelect(service.id)}
            >
              {service.name}
            </Button>
          ))}
        </div>
      </div>

      {selectedServiceId && (
        <div className="space-y-2">
          <Label>Profissional</Label>
          {employees.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum profissional disponível para este serviço.
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {employees.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => handleEmployeeSelect(employee.id)}
                  className={`flex shrink-0 cursor-pointer flex-col items-center gap-2 rounded-lg border p-2 transition-colors ${
                    selectedEmployeeId === employee.id
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={employee.imageUrl}></AvatarImage>
                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="w-20 truncate text-center text-xs font-medium">
                    {employee.name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedEmployeeId && (
        <div className="space-y-2">
          <Label>Data</Label>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              locale={ptBR}
              selected={selectedDay}
              onSelect={handleDateSelect}
              disabled={{ before: new Date() }}
              classNames={{ day: "cursor-pointer" }}
            />
          </div>
        </div>
      )}

      {selectedDay && (
        <div className="space-y-2">
          <Label>Horário</Label>
          {availableTimes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum horário disponível para esse dia.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableTimes.map((time) => (
                <Button
                  key={time}
                  type="button"
                  variant={selectedTime === time ? "default" : "outline"}
                  className="cursor-pointer rounded-full"
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTime && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-1">
              <Label htmlFor="walkin-client-name">Nome do cliente</Label>
              <Input
                id="walkin-client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="walkin-client-phone">Telefone (opcional)</Label>
              <Input
                id="walkin-client-phone"
                type="tel"
                placeholder="(11) 91234-5678"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTime && (
        <Button
          className="w-full cursor-pointer py-5"
          disabled={isSubmitting || !clientName.trim()}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            "Criar agendamento"
          )}
        </Button>
      )}
    </div>
  )
}

export default WalkInBookingForm
