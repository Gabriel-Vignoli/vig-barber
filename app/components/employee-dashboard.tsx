"use client"

import { useMemo, useState } from "react"
import { format, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, XIcon } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

const getInitials = (name?: string | null) => {
  if (!name) return "?"

  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.charAt(0) ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ""

  return (first + last).toUpperCase()
}

interface EmployeeBooking {
  id: string
  bookingDate: Date
  user: { name: string | null; image: string | null }
  barbershopService: { name: string; durationInMinutes: number }
}

interface EmployeeDashboardProps {
  employeeName: string
  upcomingBookings: EmployeeBooking[]
  concludedBookings: EmployeeBooking[]
}

type BookingTab = "upcoming" | "concluded"

const pluralizeBookings = (count: number) =>
  count === 1 ? "agendamento" : "agendamentos"

const BookingCard = ({
  booking,
  isConfirmed,
}: {
  booking: EmployeeBooking
  isConfirmed: boolean
}) => (
  <Card className="p-1">
    <CardContent className="flex flex-col gap-3 p-4">
      <Badge
        className="w-fit"
        variant={isConfirmed ? "success" : "destructive"}
      >
        {isConfirmed ? "Confirmado" : "Finalizado"}
      </Badge>

      <div className="flex items-center gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage
            src={booking.user.image ?? ""}
            alt={booking.user.name ?? "Cliente"}
            referrerPolicy="no-referrer"
          />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            {getInitials(booking.user.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {booking.user.name ?? "Cliente"}
          </p>
          <p className="text-muted-foreground truncate text-sm">
            {booking.barbershopService.name} ·{" "}
            {booking.barbershopService.durationInMinutes} min
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold">
            {format(booking.bookingDate, "dd/MM", { locale: ptBR })}
          </p>
          <p className="text-muted-foreground text-sm">
            {format(booking.bookingDate, "HH:mm")}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)

const EmployeeDashboard = ({
  employeeName,
  upcomingBookings,
  concludedBookings,
}: EmployeeDashboardProps) => {
  const [activeTab, setActiveTab] = useState<BookingTab>("upcoming")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const baseBookings =
    activeTab === "upcoming" ? upcomingBookings : concludedBookings

  const activeBookings = useMemo(() => {
    if (!selectedDate) return baseBookings
    return baseBookings.filter((booking) =>
      isSameDay(booking.bookingDate, selectedDate),
    )
  }, [baseBookings, selectedDate])

  const emptyMessage = selectedDate
    ? "Nenhum agendamento nessa data."
    : activeTab === "upcoming"
      ? "Você não possui agendamentos futuros."
      : "Você ainda não possui agendamentos finalizados."

  const handleTabChange = (tab: BookingTab) => {
    setActiveTab(tab)
    setSelectedDate(undefined)
  }

  return (
    <div className="p-4 md:px-8 lg:px-16 lg:pt-14 xl:px-32">
      <h2 className="text-xl md:text-3xl">
        Olá, <span className="font-bold">{employeeName}</span>!
      </h2>
      <p className="text-muted-foreground mt-1 text-sm md:text-base">
        {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Button
          variant={activeTab === "upcoming" ? "default" : "outline"}
          className="cursor-pointer border-0 xl:p-4 xl:text-base"
          onClick={() => handleTabChange("upcoming")}
        >
          Confirmados ({upcomingBookings.length})
        </Button>
        <Button
          variant={activeTab === "concluded" ? "default" : "outline"}
          className="cursor-pointer border-0 xl:p-4 xl:text-base"
          onClick={() => handleTabChange("concluded")}
        >
          Finalizados ({concludedBookings.length})
        </Button>

        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger
            render={(triggerProps) => (
              <Button
                variant={selectedDate ? "default" : "outline"}
                className="cursor-pointer gap-2 border-0 xl:p-4 xl:text-base"
                {...triggerProps}
              >
                <CalendarIcon className="size-4.5 xl:size-5" />
                {selectedDate
                  ? format(selectedDate, "dd/MM/yyyy")
                  : "Filtrar por data"}
              </Button>
            )}
          />
          <PopoverContent className="w-auto p-2">
            <Calendar
              mode="single"
              locale={ptBR}
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date)
                setIsCalendarOpen(false)
              }}
              classNames={{ day: "cursor-pointer" }}
            />
          </PopoverContent>
        </Popover>

        {selectedDate && (
          <Button
            size="icon-sm"
            variant="ghost"
            className="cursor-pointer"
            onClick={() => setSelectedDate(undefined)}
          >
            <XIcon size={16} />
          </Button>
        )}
      </div>

      <p className="text-muted-foreground mt-4 text-sm md:text-base">
        {selectedDate
          ? `${activeBookings.length} ${pluralizeBookings(activeBookings.length)} em ${format(selectedDate, "dd/MM/yyyy")}`
          : `${activeBookings.length} ${pluralizeBookings(activeBookings.length)} ${
              activeTab === "upcoming" ? "confirmados" : "finalizados"
            }`}
      </p>

      {activeBookings.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm md:text-base">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-4 space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {activeBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              isConfirmed={activeTab === "upcoming"}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default EmployeeDashboard
