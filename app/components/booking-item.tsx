import { Card, CardContent } from "./ui/card"
import { Avatar, AvatarImage } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { Prisma } from "@prisma/client"
import { format, isFuture } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "./ui/sheet"
import Image from "next/image"
import PhoneItem from "./phone-item"

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
  const {
    barbershopService: { barbershop },
  } = booking
  const isConfirmed = isFuture(booking.bookingDate)

  return (
    <Sheet>
      <SheetTrigger className="w-full">
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
              <h3 className="font-semibold">
                {booking.barbershopService.name}
              </h3>

              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={barbershop.imageUrl}></AvatarImage>
                </Avatar>
                <p className="text-sm">{barbershop.name}</p>
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
      </SheetTrigger>
      <SheetContent className="px-4">
        <SheetHeader>
          <SheetTrigger className="text-left">
            Informações da Reserva
          </SheetTrigger>
        </SheetHeader>

        <div className="relative flex h-45 w-full items-end">
          <Image
            src="/map.png"
            fill
            className="rounded-xl"
            alt="Localização da Barbearia"
          ></Image>

          <Card className="z-50 mx-5 mb-3 w-full rounded-xl">
            <CardContent className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={barbershop.imageUrl}></AvatarImage>
              </Avatar>
              <div>
                <h3 className="font-bold">{barbershop.name}</h3>
                <p className="text-xs">{barbershop.address}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-3">
          <Badge
            className="w-fit"
            variant={isConfirmed ? "default" : "destructive"}
          >
            {isConfirmed ? "Confirmado" : "Finalizado"}
          </Badge>

          <Card className="mt-3 mb-6">
            <CardContent className="space-y-3 p-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">{booking.barbershopService.name}</h2>
                <p className="text-sm font-bold">
                  {Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(booking.barbershopService.price))}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-sm text-gray-400">Data</h2>
                <p className="text-sm">
                  {format(booking.bookingDate, "d 'de' MMMM", {
                    locale: ptBR,
                  })}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-sm text-gray-400">Horário</h2>
                <p className="text-sm">
                  {format(booking.bookingDate, "HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-sm text-gray-400">Barbearia</h2>
                <p className="text-sm">{barbershop.name}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {barbershop.phones.map((phone, index) => (
              <PhoneItem key={index} phone={phone}></PhoneItem>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default BookingItem
