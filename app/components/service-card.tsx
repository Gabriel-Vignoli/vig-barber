"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet"
import { Calendar } from "./ui/calendar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog"
import { Dialog, DialogContent } from "./ui/dialog"
import { ptBR } from "date-fns/locale"
import { format, set } from "date-fns"
import { Booking } from "@prisma/client"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { getBookings } from "../_actions/get-bookings"
import { createBooking } from "../_actions/create-booking"
import { getEmployeesForService } from "../_actions/get-employees-for-service"
import { getTimeList } from "../_lib/time-list"
import { showBookingSuccessToast } from "./booking-success-toast"
import SignInDialog from "./sign-in-dialog"
import BookingSummary from "./booking-summary"

interface ServiceCardProps {
  service: {
    id: string
    name: string
    description: string
    price: number
    imageUrl: string
  }
}

interface EmployeeOption {
  id: string
  name: string
  imageUrl: string
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const { data } = useSession()

  const [signInDialogIsOpen, setSignInDialogIsOpen] = useState(false)
  const [bookingSheetIsOpen, setBookingSheetIsOpen] = useState(false)
  const [confirmDialogIsOpen, setConfirmDialogIsOpen] = useState(false)

  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<
    string | undefined
  >(undefined)
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  )
  const [dayBookings, setDayBookings] = useState<Booking[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchEmployees = async () => {
      const result = await getEmployeesForService(service.id)
      setEmployees(result)
    }
    fetchEmployees()
  }, [service.id])

  useEffect(() => {
    const fetch = async () => {
      if (!selectedDay || !selectedEmployeeId) return
      const bookings = await getBookings({
        date: selectedDay,
        employeeId: selectedEmployeeId,
      })
      setDayBookings(bookings)
    }
    fetch()
  }, [selectedDay, selectedEmployeeId])

  const selectedEmployee = employees.find(
    (employee) => employee.id === selectedEmployeeId,
  )

  const selectedDate = useMemo(() => {
    if (!selectedDay || !selectedTime) return undefined
    return set(selectedDay, {
      hours: parseInt(selectedTime.split(":")[0]),
      minutes: parseInt(selectedTime.split(":")[1]),
    })
  }, [selectedDay, selectedTime])

  const handleReservarClick = () => {
    if (data?.user) {
      return setBookingSheetIsOpen(true)
    }
    return setSignInDialogIsOpen(true)
  }

  const handleSheetOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedEmployeeId(undefined)
      setSelectedDay(undefined)
      setSelectedTime(undefined)
      setDayBookings([])
    }
    setBookingSheetIsOpen(isOpen)
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

  const handleConfirmBooking = async () => {
    try {
      if (!selectedDay || !selectedTime || !selectedEmployeeId) return

      const validTimes = getTimeList(dayBookings, selectedDay)
      if (!validTimes.includes(selectedTime)) {
        toast.error("Horário indisponível, selecione outro.")
        setSelectedTime(undefined)
        setConfirmDialogIsOpen(false)
        return
      }

      setIsSubmitting(true)

      const hour = Number(selectedTime.split(":")[0])
      const minute = Number(selectedTime.split(":")[1])
      const bookingDate = set(selectedDay, { hours: hour, minutes: minute })

      await createBooking({
        barbershopServiceId: service.id,
        employeeId: selectedEmployeeId,
        bookingDate,
      })

      setConfirmDialogIsOpen(false)
      handleSheetOpenChange(false)
      showBookingSuccessToast()
    } catch (error) {
      console.log(error)
      toast.error("Erro ao criar reserva!")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card className="w-32 shrink-0 p-0 md:w-52 lg:w-60">
        <CardContent className="p-0">
          <div className="relative h-32 w-full md:h-48 lg:h-56">
            <Image
              src={service.imageUrl}
              alt={service.name}
              fill
              sizes="(min-width: 1024px) 240px, (min-width: 768px) 208px, 128px"
              className="rounded-xl object-cover"
            />
          </div>
          <div className="px-2 py-2 md:px-3 md:py-4">
            <h3 className="truncate text-sm font-semibold md:text-lg">
              {service.name}
            </h3>
            <p className="truncate text-xs text-gray-400 md:text-base">
              {service.description}
            </p>
            <p className="text-primary mt-1 text-sm font-bold md:text-base">
              {Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(service.price)}
            </p>
            <Button
              variant="outline"
              className="mt-2 w-full cursor-pointer py-3 text-sm md:mt-4 md:py-5 md:text-base"
              onClick={handleReservarClick}
            >
              Reservar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Sheet open={bookingSheetIsOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="flex flex-col px-0 lg:w-120 lg:max-w-120">
          <SheetHeader className="shrink-0 px-4 pt-4">
            <SheetTitle className="lg:text-lg">Fazer Reserva</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-0 [&::-webkit-scrollbar]:hidden">
            {/* Step 1: choose employee */}
            <div className="border-b px-4 pb-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-400 uppercase">
                Escolha o profissional
              </h3>
              {employees.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Nenhum profissional disponível para este serviço.
                </p>
              ) : (
                <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                  {employees.map((employee) => (
                    <button
                      key={employee.id}
                      onClick={() => handleEmployeeSelect(employee.id)}
                      className={`flex shrink-0 cursor-pointer flex-col items-center gap-2 rounded-lg border p-2 transition-colors lg:p-3 xl:p-4 ${
                        selectedEmployeeId === employee.id
                          ? "border-primary bg-primary/10"
                          : "border-border"
                      }`}
                    >
                      <Avatar className="h-15 w-15 lg:h-18 lg:w-18">
                        <AvatarImage src={employee.imageUrl}></AvatarImage>
                        <AvatarFallback>
                          {employee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="w-20 truncate text-center text-xs font-medium lg:text-sm xl:text-base">
                        {employee.name}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: calendar */}
            {selectedEmployeeId && (
              <div className="flex justify-center border-b bg-transparent pb-6 lg:pb-8">
                <Calendar
                  mode="single"
                  locale={ptBR}
                  selected={selectedDay}
                  onSelect={handleDateSelect}
                  disabled={{ before: new Date() }}
                  className="bg-transparent lg:w-full lg:max-w-3xs lg:p-2"
                  classNames={{
                    day: "cursor-pointer",
                    button_previous: "cursor-pointer",
                    button_next: "cursor-pointer",
                  }}
                  styles={{
                    weekday: {
                      width: "100%",
                      textTransform: "capitalize",
                    },
                    day: {
                      width: "100%",
                    },
                    button_previous: {
                      width: "32px",
                      height: "32px",
                    },
                    button_next: {
                      width: "32px",
                      height: "32px",
                    },
                    month_caption: {
                      textTransform: "capitalize",
                    },
                  }}
                />
              </div>
            )}

            {/* Step 3: time list */}
            {selectedDay && (
              <div className="flex gap-3 overflow-x-auto border-b p-4 lg:gap-4 lg:p-6 [&::-webkit-scrollbar]:hidden">
                {getTimeList(dayBookings, selectedDay).map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    className="cursor-pointer rounded-full lg:h-10 lg:px-5 lg:text-base"
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            )}

            {/* Step 4: summary */}
            {selectedTime && selectedDay && selectedEmployee && (
              <div className="p-4 lg:p-6">
                <BookingSummary
                  service={service}
                  selectedDay={selectedDate as Date}
                  employee={{ name: selectedEmployee.name }}
                />
              </div>
            )}
          </div>

          <SheetFooter className="shrink-0 border-t p-4 lg:p-6">
            <AlertDialog
              open={confirmDialogIsOpen}
              onOpenChange={setConfirmDialogIsOpen}
            >
              <AlertDialogTrigger
                render={
                  <Button
                    className="cursor-pointer py-5 lg:py-6 lg:text-base"
                    disabled={
                      !selectedTime || !selectedDay || !selectedEmployeeId
                    }
                  >
                    Confirmar
                  </Button>
                }
              >
                Show Dialog
              </AlertDialogTrigger>
              <AlertDialogContent
                size="sm"
                className="w-[90%] max-w-[90%] lg:w-auto lg:max-w-md"
              >
                <AlertDialogHeader>
                  <AlertDialogTitle className="lg:text-xl">
                    Confirmar Reserva
                  </AlertDialogTitle>
                  <AlertDialogDescription className="lg:text-base">
                    Deseja confirmar o agendamento de {service.name} com{" "}
                    {selectedEmployee?.name} para{" "}
                    {selectedDate
                      ? format(selectedDate, "dd 'de' MMMM 'às' HH:mm", {
                          locale: ptBR,
                        })
                      : ""}
                    ?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="lg:p-6">
                  <AlertDialogCancel
                    className="cursor-pointer py-5 lg:py-6 lg:text-base"
                    disabled={isSubmitting}
                  >
                    Voltar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="cursor-pointer py-5 lg:py-6 lg:text-base"
                    disabled={isSubmitting}
                    onClick={(e) => {
                      e.preventDefault()
                      handleConfirmBooking()
                    }}
                  >
                    {isSubmitting ? "Confirmando..." : "Confirmar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog
        open={signInDialogIsOpen}
        onOpenChange={(open) => setSignInDialogIsOpen(open)}
      >
        <DialogContent>
          <SignInDialog></SignInDialog>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ServiceCard
