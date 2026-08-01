import { Card, CardContent } from "./ui/card"
import { Avatar, AvatarImage } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { Prisma } from "@prisma/client"
import { format, isFuture } from "date-fns"
import { ptBR } from "date-fns/locale"

interface BookingItemsProps {
  booking: Prisma.BookingGetPayload<{
    include: {
      barbershopService: {
        include: {
          barbershop: true
        }
      }
    }
  }>
}
// TODO recive schedule as props

const BookingItem = ({ booking }: BookingItemsProps) => {
  const isConfirmed = isFuture(booking.bookingDate)

  return (
    <>
      <Card className="mt-2 min-w-[90%] p-0">
        <CardContent className="flex items-stretch justify-between p-0">
          {/* Left */}
          <div className="flex flex-col gap-2 p-4">
            <Badge
              className="w-fit"
              variant={isConfirmed ? "default" : "destructive"}
            >
              {isConfirmed ? "Confirmado" : "Finalizado"}
            </Badge>
            <h3 className="font-semibold">{booking.barbershopService.name}</h3>

            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={booking.barbershopService.barbershop.imageUrl}
                ></AvatarImage>
              </Avatar>
              <p className="text-sm">
                {booking.barbershopService.barbershop.name}
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="border-border flex flex-col items-center justify-center border-l px-5">
            <p className="text-sm capitalize">
              {format(booking.bookingDate, "MMMM", { locale: ptBR })}
            </p>
            <p className="text-2xl font-bold">
              {format(booking.bookingDate, "dd", { locale: ptBR })}
            </p>
            <p className="font-semibold">
              {format(booking.bookingDate, "HH:mm", { locale: ptBR })}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default BookingItem
