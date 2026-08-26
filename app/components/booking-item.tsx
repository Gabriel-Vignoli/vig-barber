"use client"

import { Card, CardContent } from "./ui/card"
import { Avatar, AvatarImage } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { PaymentMethod } from "@prisma/client"
import { format, isFuture } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
} from "./ui/sheet"
import Image from "next/image"
import PhoneItem from "./phone-item"
import { Button } from "./ui/button"
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
import { deleteBooking } from "../_actions/delete-booking"
import { toast } from "sonner"
import { useState } from "react"
import { useRouter } from "next/navigation"
import BookingSummary from "./booking-summary"

interface BookingItemsProps {
  booking: {
    id: string
    userId: string
    bookingDate: Date
    paymentMethod: PaymentMethod | null
    barbershopService: {
      id: string
      name: string
      description: string
      imageUrl: string
      durationInMinutes: number
      barbershopId: string
      createdAt: Date
      updatedAt: Date
      price: number
      barbershop: {
        id: string
        name: string
        address: string
        description: string
        imageUrl: string
        phones: string[]
        createdAt: Date
        updatedAt: Date
      }
    }
  }
}

const BookingItem = ({ booking }: BookingItemsProps) => {
  const router = useRouter()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const {
    barbershopService: { barbershop },
  } = booking
  const isConfirmed = isFuture(booking.bookingDate)

  const handleCancelBooking = async () => {
    try {
      setIsDeleting(true)
      await deleteBooking(booking.id)

      // Only close both once the delete actually succeeds
      setIsAlertDialogOpen(false)
      setIsSheetOpen(false)

      toast.success("Reserva cancelada com sucesso!")

      // Re-fetch the Server Component data so the list reflects the deletion
      router.refresh()
    } catch (error) {
      toast.error("Erro ao cancelar reserva. Tente novamente.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSheetOpenChange = (isOpen: boolean) => {
    setIsSheetOpen(isOpen)
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger className="w-full min-w-[90%] cursor-pointer">
        <Card className="mt-2 min-w-[90%] cursor-pointer p-0">
          <CardContent className="flex items-stretch justify-between p-0">
            {/* Left */}
            <div className="flex flex-col gap-2 p-4 md:gap-3 lg:gap-4">
              <Badge
                className="w-fit px-2 py-2 md:px-3 md:py-3 md:text-sm"
                variant={isConfirmed ? "success" : "destructive"}
              >
                {isConfirmed ? "Confirmado" : "Finalizado"}
              </Badge>
              <h3 className="font-semibold md:text-xl">
                {booking.barbershopService.name}
              </h3>

              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 md:h-8 md:w-8">
                  <AvatarImage src={barbershop.imageUrl}></AvatarImage>
                </Avatar>
                <p className="text-sm lg:text-base">{barbershop.name}</p>
              </div>
            </div>

            {/* Right */}
            <div className="border-border flex flex-col items-center justify-center border-l px-5 md:px-8 lg:px-14">
              <p className="text-sm capitalize md:text-base">
                {format(booking.bookingDate, "MMMM", { locale: ptBR })}
              </p>
              <p className="text-2xl font-bold lg:text-3xl">
                {format(booking.bookingDate, "dd", { locale: ptBR })}
              </p>
              <p className="font-semibold md:text-lg">
                {format(booking.bookingDate, "HH:mm", { locale: ptBR })}
              </p>
            </div>
          </CardContent>
        </Card>
      </SheetTrigger>
      <SheetContent className="px-4 data-[side=right]:w-[85%] sm:max-w-lg">
        <SheetHeader>
          <SheetTrigger className="mt-2 text-left md:mt-3 md:text-base lg:mt-4 lg:text-lg">
            Informações da Reserva
          </SheetTrigger>
        </SheetHeader>
        <div className="relative flex h-36 w-full items-end md:h-45">
          <Image
            src="/map.png"
            fill
            className="rounded-xl"
            alt="Localização da Barbearia"
          ></Image>

          <Card className="z-50 mx-5 mb-3 w-full rounded-xl">
            <CardContent className="flex items-center gap-3">
              <Avatar className="h-8 w-8 md:h-10 md:w-10">
                <AvatarImage src={barbershop.imageUrl}></AvatarImage>
              </Avatar>
              <div>
                <h3 className="font-bold lg:text-base">{barbershop.name}</h3>
                <p className="text-xs lg:text-sm">{barbershop.address}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-3">
          <Badge
            className="w-fit px-2 py-2 md:px-3 md:py-3 md:text-sm"
            variant={isConfirmed ? "success" : "destructive"}
          >
            {isConfirmed ? "Confirmado" : "Finalizado"}
          </Badge>

          <div className="mt-6 mb-3 md:mb-7">
            <BookingSummary
              barbershop={barbershop}
              service={booking.barbershopService}
              selectedDay={booking.bookingDate}
            ></BookingSummary>
          </div>

          <div className="space-y-3">
            {barbershop.phones.map((phone, index) => (
              <PhoneItem key={index} phone={phone}></PhoneItem>
            ))}
          </div>
        </div>
        <SheetFooter className="px-0 py-4">
          <div className="flex w-full items-center gap-3">
            <SheetClose
              render={
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer py-5 lg:text-base"
                >
                  Voltar
                </Button>
              }
            ></SheetClose>
            {isConfirmed && (
              <AlertDialog
                open={isAlertDialogOpen}
                onOpenChange={setIsAlertDialogOpen}
              >
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="destructive"
                      className="flex-1 cursor-pointer py-5 lg:text-base"
                    >
                      Cancelar reserva
                    </Button>
                  }
                >
                  Show Dialog
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[90%]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Você tem certeza que deseja cancelar sua reserva?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Pense bem se você deseja realmente cancelar sua reserva.
                      Essa ação é irreversível.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      variant="destructive"
                      className="cursor-pointer py-5"
                      disabled={isDeleting}
                    >
                      Voltar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="outline"
                      className="cursor-pointer py-5"
                      disabled={isDeleting}
                      onClick={(e) => {
                        // Prevent the dialog from auto-closing before the
                        // delete actually finishes
                        e.preventDefault()
                        handleCancelBooking()
                      }}
                    >
                      {isDeleting ? "Cancelando..." : "Cancelar Reserva"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default BookingItem
