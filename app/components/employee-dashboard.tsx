import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent } from "./ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"

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

const BookingCard = ({ booking }: { booking: EmployeeBooking }) => (
  <Card>
    <CardContent className="flex items-center gap-3 p-4">
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
    </CardContent>
  </Card>
)

const EmployeeDashboard = ({
  employeeName,
  upcomingBookings,
  concludedBookings,
}: EmployeeDashboardProps) => {
  return (
    <div className="p-4 md:px-8 lg:px-16 lg:pt-14 xl:px-32">
      <h2 className="text-xl md:text-3xl">
        Olá, <span className="font-bold">{employeeName}</span>!
      </h2>
      <p className="text-muted-foreground mt-1 text-sm md:text-base">
        {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
      </p>

      <h3 className="mt-8 text-xs font-bold text-gray-400 uppercase md:text-base">
        Próximos agendamentos
      </h3>

      {upcomingBookings.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm md:text-base">
          Você não possui agendamentos futuros.
        </p>
      ) : (
        <div className="mt-4 space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {upcomingBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}

      <h3 className="mt-8 text-xs font-bold text-gray-400 uppercase md:mt-12 md:text-base">
        Histórico
      </h3>

      {concludedBookings.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm md:text-base">
          Você ainda não possui agendamentos finalizados.
        </p>
      ) : (
        <div className="mt-4 space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {concludedBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  )
}

export default EmployeeDashboard
