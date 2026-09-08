"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Card, CardContent } from "./ui/card"
import AdminBookingStatusBadge from "./admin-booking-status-badge"

const getInitials = (name?: string | null) => {
  if (!name) return "?"

  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.charAt(0) ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ""

  return (first + last).toUpperCase()
}

interface AdminBooking {
  id: string
  bookingDate: Date
  status: "PENDING" | "COMPLETED" | "CANCELLED"
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
  employee: {
    user: { name: string | null }
  }
  barbershopService: {
    name: string
    price: number
  }
}

interface AdminBookingsTableProps {
  bookings: AdminBooking[]
}

const AdminBookingsTable = ({ bookings }: AdminBookingsTableProps) => {
  if (bookings.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nenhum agendamento encontrado.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <Card key={booking.id}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage
                  src={booking.user.image ?? ""}
                  alt={booking.user.name ?? "Cliente"}
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  {getInitials(booking.user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {booking.user.name ?? "Cliente"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {booking.user.email}
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-1 sm:px-4">
              <p className="text-sm font-medium">
                {booking.barbershopService.name}
              </p>
              <p className="text-muted-foreground text-xs">
                com {booking.employee.user.name ?? "Funcionário"}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center sm:gap-1">
              <p className="text-sm font-medium">
                {format(booking.bookingDate, "dd 'de' MMMM, HH:mm", {
                  locale: ptBR,
                })}
              </p>
              <AdminBookingStatusBadge
                status={booking.status}
                bookingDate={booking.bookingDate}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default AdminBookingsTable
