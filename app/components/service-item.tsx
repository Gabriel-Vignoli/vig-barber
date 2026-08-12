"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet"
import { Calendar } from "./ui/calendar"
import { ptBR } from "date-fns/locale"
import { Barbershop, BarbershopService, Booking } from "@prisma/client"
import { set } from "date-fns"
import { createBooking } from "../_actions/create-booking"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { getBookings } from "../_actions/get-bookings"
import { Dialog, DialogContent } from "./ui/dialog"
import SignInDialog from "./sign-in-dialog"
import BookingSummary from "./booking-summary"

interface ServiceItemProps {
  service: Omit<BarbershopService, "price"> & { price: number }
  barbershop: Pick<Barbershop, "name">
}

const TIME_LIST = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

const getTimeList = (bookings: Booking[], selectedDay: Date) => {
  const now = new Date()
  const isToday =
    selectedDay.getDate() === now.getDate() &&
    selectedDay.getMonth() === now.getMonth() &&
    selectedDay.getFullYear() === now.getFullYear()

  return TIME_LIST.filter((time) => {
    const hour = Number(time.split(":")[0])
    const minutes = Number(time.split(":")[1])

    const hasBookingOnCurrentTime = bookings.some(
      (booking) =>
        booking.bookingDate.getHours() === hour &&
        booking.bookingDate.getMinutes() === minutes,
    )

    if (hasBookingOnCurrentTime) return false

    if (isToday) {
      const timeIsInThePast =
        hour < now.getHours() ||
        (hour === now.getHours() && minutes <= now.getMinutes())

      if (timeIsInThePast) return false
    }

    return true
  })
}

const ServiceItem = ({ service, barbershop }: ServiceItemProps) => {
  const [signInDialogIsOpen, setSignInDialogIsOpen] = useState(false)
  const { data } = useSession()
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  )
  const [dayBookings, setDayBookings] = useState<Booking[]>([])
  const [bookingSheetIsOpen, setBookingSheetIsOpen] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      if (!selectedDay) return
      const bookings = await getBookings({
        date: selectedDay,
        serviceId: service.id,
      })
      setDayBookings(bookings)
    }
    fetch()
  }, [selectedDay, service.id])

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

  const handleCreateBooking = async () => {
    try {
      if (!selectedDay || !selectedTime) return
      const validTimes = getTimeList(dayBookings, selectedDay)
      if (!validTimes.includes(selectedTime)) {
        toast.error("Horário indisponível, selecione outro.")
        setSelectedTime(undefined)
        return
      }

      const hour = Number(selectedTime.split(":")[0])
      const minute = Number(selectedTime.split(":")[1])

      const newDate = set(selectedDay, {
        minutes: minute,
        hours: hour,
      })

      await createBooking({
        barbershopServiceId: service.id,
        bookingDate: newDate,
      })
      setBookingSheetIsOpen(false)
      toast.success("Reserva criada com sucesso!")
    } catch (error) {
      console.log(error)
      toast.error("Error ao criar reserva!")
    }
  }

  return (
    <>
      <Card className="p-0">
        <CardContent className="flex items-center gap-2 p-3">
          <div className="relative max-h-27.5 min-h-27.5 max-w-27.5 min-w-27.5 overflow-hidden rounded-lg">
            <Image
              src={service.imageUrl}
              alt={service.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{service.name}</h3>
            <p className="text-sm text-gray-400">{service.description}</p>
            <div className="flex items-center justify-between">
              <p className="text-primary text-sm font-bold">
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
                  className="cursor-pointer"
                  onClick={handleBookingClick}
                >
                  Reservar
                </Button>

                <SheetContent className="px-0">
                  <SheetHeader>
                    <SheetTitle>Fazer Reserva</SheetTitle>
                  </SheetHeader>

                  <div className="flex justify-center border-b bg-transparent pb-6">
                    <Calendar
                      mode="single"
                      locale={ptBR}
                      selected={selectedDay}
                      onSelect={handleDateSelect}
                      disabled={{ before: new Date() }}
                      className="bg-transparent"
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
                    <div className="flex gap-3 overflow-x-auto border-b p-4 [&::-webkit-scrollbar]:hidden">
                      {getTimeList(dayBookings, selectedDay).map((time) => (
                        <Button
                          key={time}
                          variant={
                            selectedTime === time ? "default" : "outline"
                          }
                          className="cursor-pointer rounded-full"
                          onClick={() => handleTimeSelect(time)}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  )}

                  {selectedTime && selectedDay && (
                    <div className="p-4">
                      <BookingSummary
                        barbershop={barbershop}
                        service={service}
                        selectedDay={selectedDate as Date}
                      ></BookingSummary>
                    </div>
                  )}

                  <SheetFooter>
                    <SheetClose
                      render={
                        <Button
                          onClick={handleCreateBooking}
                          className="cursor-pointer py-5"
                          disabled={!selectedTime || !selectedDay}
                        >
                          Confirmar
                        </Button>
                      }
                    ></SheetClose>
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
          <SignInDialog></SignInDialog>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ServiceItem
