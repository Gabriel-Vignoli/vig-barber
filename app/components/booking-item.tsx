"use client"

import { Card, CardContent } from "./ui/card"
import { Avatar, AvatarImage } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { PaymentMethod, Prisma } from "@prisma/client"
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
                  }).format(booking.barbershopService.price)}
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

        <SheetFooter className="px-0 py-4">
          <div className="flex w-full items-center gap-3">
            <SheetClose
              render={
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer py-5"
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
                      className="flex-1 cursor-pointer py-5"
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
