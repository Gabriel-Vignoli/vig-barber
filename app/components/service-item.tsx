"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet"
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
import { Calendar } from "./ui/calendar"
import { ptBR } from "date-fns/locale"
import { Barbershop, BarbershopService, Booking } from "@prisma/client"
import { format, set } from "date-fns"
import { createBooking } from "../_actions/create-booking"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { getBookings } from "../_actions/get-bookings"
import { Dialog, DialogContent } from "./ui/dialog"
import SignInDialog from "./sign-in-dialog"
import BookingSummary from "./booking-summary"
import { getTimeList } from "../_lib/time-list"
import { showBookingSuccessToast } from "./booking-success-toast"

interface ServiceItemProps {
  service: Omit<BarbershopService, "price"> & { price: number }
  barbershop: Pick<Barbershop, "name">
  employeeId: string
  employeeName: string
}

const ServiceItem = ({
  service,
  employeeId,
  employeeName,
}: ServiceItemProps) => {
  const [signInDialogIsOpen, setSignInDialogIsOpen] = useState(false)
  const { data } = useSession()
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  )
  const [dayBookings, setDayBookings] = useState<Booking[]>([])
  const [bookingSheetIsOpen, setBookingSheetIsOpen] = useState(false)
  const [confirmDialogIsOpen, setConfirmDialogIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      if (!selectedDay) return
      const bookings = await getBookings({
        date: selectedDay,
        employeeId,
      })
      setDayBookings(bookings)
    }
    fetch()
  }, [selectedDay, employeeId])

  const selectedDate = useMemo(() => {
    if (!selectedDay || !selectedTime) return undefined
    return set(selectedDay, {
      hours: selectedTime ? parseInt(selectedTime.split(":")[0]) : 0,
      minutes: selectedTime ? parseInt(selectedTime.split(":")[1]) : 0,
    })
  }, [selectedDay, selectedTime])

  const handleBookingClick = () => {
    if (data?.user) {
      return setBookingSheetIsOpen(true)
    }
    return setSignInDialogIsOpen(true)
  }

  const handleBookingSheetOpenChange = () => {
    setSelectedTime(undefined)
    setSelectedDay(undefined)
    setDayBookings([])
    setBookingSheetIsOpen(false)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDay(date)
    setSelectedTime(undefined)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
  }

  const handleConfirmBooking = async () => {
    try {
      if (!selectedDay || !selectedTime) return

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

      const newDate = set(selectedDay, {
        minutes: minute,
        hours: hour,
      })

      await createBooking({
        barbershopServiceId: service.id,
        employeeId,
        bookingDate: newDate,
      })

      setConfirmDialogIsOpen(false)
      setBookingSheetIsOpen(false)
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
      <Card className="p-0">
        <CardContent className="flex items-center gap-2 p-3 md:gap-4 md:p-4">
          <div className="relative max-h-27.5 min-h-27.5 max-w-27.5 min-w-27.5 overflow-hidden rounded-lg md:max-h-32 md:min-h-32 md:max-w-32 md:min-w-32">
            <Image
              src={service.imageUrl}
              alt={service.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex h-27.5 flex-1 flex-col justify-between md:h-32">
            <div className="space-y-2 md:space-y-3">
              <h3 className="text-sm font-semibold md:text-base">
                {service.name}
              </h3>
              <p className="line-clamp-2 text-sm text-gray-400 md:text-base">
                {service.description}
              </p>
            </div>

            <div className="flex items-end justify-between">
              <p className="text-primary text-sm font-bold md:text-base">
                {Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(service.price)}
              </p>

              <Sheet
                open={bookingSheetIsOpen}
                onOpenChange={handleBookingSheetOpenChange}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0 cursor-pointer md:h-9 md:px-4 md:text-base"
                  onClick={handleBookingClick}
                >
                  Reservar
                </Button>

                <SheetContent className="flex flex-col px-0 lg:w-120 lg:max-w-120">
                  <SheetHeader className="shrink-0 px-4">
                    <SheetTitle className="lg:text-lg">
                      Fazer Reserva
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-0 [&::-webkit-scrollbar]:hidden">
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

                    {selectedDay && (
                      <div className="flex gap-3 overflow-x-auto border-b p-4 lg:gap-4 lg:p-6 [&::-webkit-scrollbar]:hidden">
                        {getTimeList(dayBookings, selectedDay).map((time) => (
                          <Button
                            key={time}
                            variant={
                              selectedTime === time ? "default" : "outline"
                            }
                            className="cursor-pointer rounded-full lg:h-10 lg:px-5 lg:text-base"
                            onClick={() => handleTimeSelect(time)}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    )}

                    {selectedTime && selectedDay && (
                      <div className="p-4 lg:p-6">
                        <BookingSummary
                          service={service}
                          selectedDay={selectedDate as Date}
                          employee={{ name: employeeName }}
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
                            disabled={!selectedTime || !selectedDay}
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
                            {employeeName} para{" "}
                            {selectedDate
                              ? format(
                                  selectedDate,
                                  "dd 'de' MMMM 'às' HH:mm",
                                  {
                                    locale: ptBR,
                                  },
                                )
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
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={signInDialogIsOpen}
        onOpenChange={(open) => setSignInDialogIsOpen(open)}
      >
        <DialogContent>
          <SignInDialog />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ServiceItem
