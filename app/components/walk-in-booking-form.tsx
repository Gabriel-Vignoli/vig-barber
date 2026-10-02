"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  Loader2Icon,
  UserIcon,
} from "lucide-react"
import { format, set, startOfToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent } from "./ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { Calendar } from "./ui/calendar"
import { cn } from "../_lib/utils"
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

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

// (11) 91234-5678 / (11) 1234-5678
const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const PERIODS = [
  { label: "Manhã", test: (h: number) => h < 12 },
  { label: "Tarde", test: (h: number) => h >= 12 && h < 18 },
  { label: "Noite", test: (h: number) => h >= 18 },
]

interface StepProps {
  number: number
  title: string
  done?: boolean
  summary?: string
  children: React.ReactNode
  sectionRef?: React.RefObject<HTMLDivElement | null>
}

const Step = ({
  number,
  title,
  done,
  summary,
  children,
  sectionRef,
}: StepProps) => (
  <section ref={sectionRef} className="scroll-mt-4 space-y-3">
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
          done
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
        aria-hidden
      >
        {done ? <CheckIcon className="size-4" /> : number}
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      {done && summary && (
        <span className="text-muted-foreground ml-auto truncate text-sm">
          {summary}
        </span>
      )}
    </div>
    <div className="pl-10">{children}</div>
  </section>
)

const WalkInBookingForm = ({ services }: WalkInBookingFormProps) => {
  const router = useRouter()

  const [selectedServiceId, setSelectedServiceId] = useState<
    string | undefined
  >(undefined)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [employeesLoadedFor, setEmployeesLoadedFor] = useState<
    string | undefined
  >(undefined)
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
  const [timesLoadedFor, setTimesLoadedFor] = useState<string | undefined>(
    undefined,
  )

  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const employeeRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<HTMLDivElement>(null)

  const selectedService = services.find((s) => s.id === selectedServiceId)
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId)

  const timesKey =
    selectedDay && selectedEmployeeId
      ? `${selectedEmployeeId}-${format(selectedDay, "yyyy-MM-dd")}`
      : undefined

  // Loading is derived from "what we asked for" vs "what we received",
  // which also makes stale responses harmless.
  const isLoadingEmployees =
    !!selectedServiceId && employeesLoadedFor !== selectedServiceId
  const isLoadingTimes = !!timesKey && timesLoadedFor !== timesKey

  useEffect(() => {
    if (!selectedServiceId) return
    let cancelled = false

    const run = async () => {
      try {
        const result = await getEmployeesForService(selectedServiceId)
        if (cancelled) return
        setEmployees(result)
      } catch {
        if (cancelled) return
        setEmployees([])
        toast.error("Não foi possível carregar os profissionais.")
      } finally {
        if (!cancelled) setEmployeesLoadedFor(selectedServiceId)
      }
    }
    run()

    return () => {
      cancelled = true
    }
  }, [selectedServiceId])

  useEffect(() => {
    if (!selectedDay || !selectedEmployeeId || !timesKey) return
    let cancelled = false

    const run = async () => {
      try {
        const [bookings, schedule] = await Promise.all([
          getBookings({ date: selectedDay, employeeId: selectedEmployeeId }),
          getEmployeeSchedule(selectedEmployeeId, selectedDay),
        ])
        if (cancelled) return
        setDayBookings(bookings)
        setDaySchedule(schedule)
      } catch {
        if (cancelled) return
        setDayBookings([])
        setDaySchedule(null)
        toast.error("Não foi possível carregar os horários.")
      } finally {
        if (!cancelled) setTimesLoadedFor(timesKey)
      }
    }
    run()

    return () => {
      cancelled = true
    }
  }, [selectedDay, selectedEmployeeId, timesKey])

  const availableTimes = useMemo(() => {
    if (!selectedDay || !selectedService || isLoadingTimes) return []
    return getTimeList(
      dayBookings,
      selectedDay,
      selectedService.durationInMinutes,
      daySchedule,
    )
  }, [dayBookings, selectedDay, selectedService, daySchedule, isLoadingTimes])

  const groupedTimes = useMemo(
    () =>
      PERIODS.map((period) => ({
        label: period.label,
        times: availableTimes.filter((t) =>
          period.test(Number(t.split(":")[0])),
        ),
      })).filter((group) => group.times.length > 0),
    [availableTimes],
  )

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    // wait for the next section to render before scrolling
    setTimeout(
      () => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      80,
    )
  }

  const handleServiceSelect = (serviceId: string) => {
    if (serviceId === selectedServiceId) return
    setSelectedServiceId(serviceId)
    setEmployees([])
    setEmployeesLoadedFor(undefined)
    setSelectedEmployeeId(undefined)
    setSelectedDay(undefined)
    setSelectedTime(undefined)
    scrollTo(employeeRef)
  }

  const handleEmployeeSelect = (employeeId: string) => {
    if (employeeId === selectedEmployeeId) return
    setSelectedEmployeeId(employeeId)
    setSelectedDay(undefined)
    setSelectedTime(undefined)
    scrollTo(dateRef)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDay(date)
    setSelectedTime(undefined)
    if (date) scrollTo(timeRef)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    scrollTo(clientRef)
  }

  const resetForm = () => {
    setSelectedServiceId(undefined)
    setEmployees([])
    setEmployeesLoadedFor(undefined)
    setSelectedEmployeeId(undefined)
    setSelectedDay(undefined)
    setSelectedTime(undefined)
    setDayBookings([])
    setDaySchedule(null)
    setTimesLoadedFor(undefined)
    setClientName("")
    setClientPhone("")
  }

  const canSubmit =
    !!selectedServiceId &&
    !!selectedEmployeeId &&
    !!selectedDay &&
    !!selectedTime &&
    clientName.trim().length > 0

  const handleSubmit = async () => {
    if (!canSubmit || !selectedDay || !selectedTime) {
      toast.error("Preencha todos os campos obrigatórios.")
      return
    }

    setIsSubmitting(true)

    try {
      const [hour, minute] = selectedTime.split(":").map(Number)
      const bookingDate = set(selectedDay, {
        hours: hour,
        minutes: minute,
        seconds: 0,
        milliseconds: 0,
      })

      await createWalkInBooking({
        employeeId: selectedEmployeeId!,
        barbershopServiceId: selectedServiceId!,
        bookingDate,
        clientName: clientName.trim(),
        clientPhone: clientPhone || undefined,
      })

      toast.success("Agendamento criado com sucesso!")
      resetForm()
      window.scrollTo({ top: 0, behavior: "smooth" })
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
    <div className="space-y-8">
      {/* 1. Service */}
      <Step
        number={1}
        title="Serviço"
        done={!!selectedService}
        summary={selectedService?.name}
      >
        <div
          role="radiogroup"
          aria-label="Serviço"
          className="grid gap-3 sm:grid-cols-2"
        >
          {services.map((service) => {
            const isSelected = selectedServiceId === service.id
            return (
              <button
                key={service.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleServiceSelect(service.id)}
                className={cn(
                  "bg-card flex cursor-pointer flex-col gap-1 rounded-xl p-4 text-left shadow-md transition-all hover:shadow-xl",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                  isSelected && "ring-primary bg-primary/5 ring-2",
                )}
              >
                <span className="font-medium">{service.name}</span>
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <ClockIcon className="size-3.5" />
                  {service.durationInMinutes} min
                  <span aria-hidden>•</span>
                  <span className="text-foreground font-semibold">
                    {currency.format(service.price)}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </Step>

      {/* 2. Employee */}
      {selectedServiceId && (
        <Step
          number={2}
          title="Profissional"
          done={!!selectedEmployee}
          summary={selectedEmployee?.name}
          sectionRef={employeeRef}
        >
          {isLoadingEmployees ? (
            <div className="flex gap-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-muted h-[104px] w-24 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum profissional atende este serviço. Escolha outro serviço.
            </p>
          ) : (
            <div
              role="radiogroup"
              aria-label="Profissional"
              className="-mx-1 flex gap-3 overflow-x-auto px-1 py-2 [&::-webkit-scrollbar]:hidden"
            >
              {employees.map((employee) => {
                const isSelected = selectedEmployeeId === employee.id
                return (
                  <button
                    key={employee.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleEmployeeSelect(employee.id)}
                    className={cn(
                      "bg-card relative flex w-24 shrink-0 cursor-pointer flex-col items-center gap-2 rounded-xl p-3 shadow-md transition-all hover:shadow-xl",
                      "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                      isSelected && "ring-primary bg-primary/5 ring-2",
                    )}
                  >
                    {isSelected && (
                      <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full">
                        <CheckIcon className="size-3" />
                      </span>
                    )}
                    <Avatar className="size-14">
                      <AvatarImage
                        src={employee.imageUrl}
                        alt={employee.name}
                      />
                      <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="w-full truncate text-center text-xs font-medium">
                      {employee.name}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </Step>
      )}

      {/* 3. Date */}
      {selectedEmployeeId && (
        <Step
          number={3}
          title="Data"
          done={!!selectedDay}
          summary={
            selectedDay
              ? format(selectedDay, "EEE, dd 'de' MMM", { locale: ptBR })
              : undefined
          }
          sectionRef={dateRef}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="flex justify-center p-2">
              <Calendar
                mode="single"
                locale={ptBR}
                selected={selectedDay}
                onSelect={handleDateSelect}
                disabled={{ before: startOfToday() }}
                classNames={{ day: "cursor-pointer" }}
              />
            </CardContent>
          </Card>
        </Step>
      )}

      {/* 4. Time */}
      {selectedDay && (
        <Step
          number={4}
          title="Horário"
          done={!!selectedTime}
          summary={selectedTime}
          sectionRef={timeRef}
        >
          {isLoadingTimes ? (
            <div
              className="grid grid-cols-4 gap-2 sm:grid-cols-6"
              aria-busy="true"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted h-9 animate-pulse rounded-full"
                />
              ))}
            </div>
          ) : groupedTimes.length === 0 ? (
            <p className="text-muted-foreground text-sm" role="status">
              Sem horários livres neste dia. Escolha outra data.
            </p>
          ) : (
            <div className="space-y-4">
              {groupedTimes.map((group) => (
                <div key={group.label} className="space-y-2">
                  <p className="text-muted-foreground text-sm">{group.label}</p>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {group.times.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        aria-pressed={selectedTime === time}
                        variant={selectedTime === time ? "default" : "outline"}
                        className="cursor-pointer rounded-full"
                        onClick={() => handleTimeSelect(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Step>
      )}

      {/* 5. Client + summary */}
      {selectedTime && selectedService && selectedDay && (
        <Step
          number={5}
          title="Cliente"
          done={clientName.trim().length > 0}
          summary={clientName.trim() || undefined}
          sectionRef={clientRef}
        >
          <div className="space-y-5">
            <Card className="border-0 shadow-md">
              <CardContent className="space-y-4 p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="walkin-client-name">Nome do cliente</Label>
                  <Input
                    id="walkin-client-name"
                    autoComplete="off"
                    autoCapitalize="words"
                    placeholder="Ex.: José da Silva"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="walkin-client-phone">
                    Telefone{" "}
                    <span className="text-muted-foreground font-normal">
                      (opcional)
                    </span>
                  </Label>
                  <Input
                    id="walkin-client-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    placeholder="(11) 91234-5678"
                    value={clientPhone}
                    onChange={(e) =>
                      setClientPhone(formatPhone(e.target.value))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50 border-0 shadow-none">
              <CardContent className="space-y-3 p-4 text-sm">
                <p className="font-semibold">Resumo do agendamento</p>
                <dl className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground flex items-center gap-2">
                      <UserIcon className="size-4" />
                      Profissional
                    </dt>
                    <dd className="font-medium">{selectedEmployee?.name}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="size-4" />
                      Data e hora
                    </dt>
                    <dd className="font-medium">
                      {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })} às{" "}
                      {selectedTime}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground flex items-center gap-2">
                      <ClockIcon className="size-4" />
                      {selectedService.name}
                    </dt>
                    <dd className="font-medium">
                      {selectedService.durationInMinutes} min
                    </dd>
                  </div>
                </dl>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="font-semibold">Total</span>
                  <span className="text-base font-bold">
                    {currency.format(selectedService.price)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full cursor-pointer py-6 text-base"
              disabled={isSubmitting || !canSubmit}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Criando agendamento...
                </>
              ) : (
                <>
                  <CheckIcon className="size-4" />
                  Criar agendamento
                </>
              )}
            </Button>
          </div>
        </Step>
      )}
    </div>
  )
}

export default WalkInBookingForm
