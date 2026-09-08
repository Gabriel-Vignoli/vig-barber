import { BookingStatus } from "@prisma/client"
import { Badge } from "./ui/badge"

interface AdminBookingStatusBadgeProps {
  status: BookingStatus
  bookingDate: Date
}

const AdminBookingStatusBadge = ({
  status,
  bookingDate,
}: AdminBookingStatusBadgeProps) => {
  if (status === "CANCELLED") {
    return <Badge variant="destructive">Cancelado</Badge>
  }

  const isFuture = bookingDate > new Date()

  return (
    <Badge variant={isFuture ? "success" : "secondary"}>
      {isFuture ? "Confirmado" : "Finalizado"}
    </Badge>
  )
}

export default AdminBookingStatusBadge
