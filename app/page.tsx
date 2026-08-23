import Header from "./components/header"
import { Button } from "./components/ui/button"
import Image from "next/image"
import { prisma } from "./_lib/prisma"
import BarbershopItem from "./components/barbershop-item"
import { quickSearchOptions } from "./_constants/search"
import BookingItem from "./components/booking-item"
import Search from "./components/search"
import { getServerSession } from "next-auth"
import { authOptions } from "./_lib/auth"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getConfirmedBookings } from "./_data/get-confirmed-bookings"

export default async function Home() {
  const session = await getServerSession(authOptions)
  const barbershops = await prisma.barbershop.findMany({})
  const popularBarbershops = await prisma.barbershop.findMany({
    orderBy: {
      name: "desc",
    },
  })

  const confirmedBookings = await getConfirmedBookings()

  return (
    <div>
      {/* Header */}
      <Header></Header>

      <div className="p-4">
        {/* Text */}
        <h2 className="text-xl font-bold">
          Olá, {session?.user ? session.user.name : "usuário, faça seu login"}!
        </h2>

        <p>
          <span className="capitalize">
            {format(new Date(), "EEEE, dd", { locale: ptBR })} de{" "}
            <span className="caitalize">
              {format(new Date(), "MMMM", { locale: ptBR })}
            </span>
          </span>
        </p>

        {/* Search */}
        <div className="mt-6">
          <Search></Search>
        </div>

        {/* Fast Search */}
        <div className="mt-6 flex items-center justify-between gap-2.5 overflow-x-scroll [&::-webkit-scrollbar]:hidden">
          {quickSearchOptions.map((option) => (
            <Button
              key={option.title}
              variant="outline"
              className="cursor-pointer gap-2 px-2 py-4"
            >
              <Image
                src={option.imageUrl}
                alt={option.title}
                width={16}
                height={16}
              />
              {option.title}
            </Button>
          ))}
        </div>

        {/* Banner */}
        <div className="relative mt-4 h-37.5 w-full">
          <Image
            src="/banner-01.png"
            alt="Banner 01"
            fill
            className="object-contain"
          />
        </div>

        {/* Schedule */}
        <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase">
          Agendamentos
        </h2>
        {confirmedBookings.length === 0 ? (
          <p className="text-sm text-gray-400">
            Nenhum agendamento até o momento
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {confirmedBookings.map((booking) => (
              <BookingItem key={booking.id} booking={booking}></BookingItem>
            ))}
          </div>
        )}
        {/* Barbershops */}
        {confirmedBookings.length === 0 && (
          <>
            <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase">
              Recomendados
            </h2>
            <div className="mt-2 flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden">
              {barbershops.map((barbershop) => (
                <BarbershopItem
                  key={barbershop.id}
                  barbershop={barbershop}
                ></BarbershopItem>
              ))}
            </div>
          </>
        )}

        <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase">
          Populares
        </h2>
        <div className="mt-2 flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden">
          {popularBarbershops.map((barbershop) => (
            <BarbershopItem
              key={barbershop.id}
              barbershop={barbershop}
            ></BarbershopItem>
          ))}
        </div>
      </div>
    </div>
  )
}
