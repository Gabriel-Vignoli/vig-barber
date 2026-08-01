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

export default async function Home() {
  const session = await getServerSession(authOptions)
  const barbershops = await prisma.barbershop.findMany({})
  const popularBarbershops = await prisma.barbershop.findMany({
    orderBy: {
      name: "desc",
    },
  })

  const bookings = session?.user
    ? await prisma.booking.findMany({
        where: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          userId: (session?.user as any).id,
          bookingDate: {
            gte: new Date(),
          },
        },
        include: {
          barbershopService: {
            include: {
              barbershop: true,
            },
          },
        },
        orderBy: {
          bookingDate: "asc",
        },
      })
    : []

  return (
    <div>
      {/* Header */}
      <Header></Header>

      <div className="p-4">
        {/* Text */}
        <h2 className="text-xl font-bold">Olá, Gabriel!</h2>

        <p>Segunda-feira, 20 de julho.</p>

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
              className="gap-2 px-2 py-4"
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
        <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {bookings.map((booking) => (
            <BookingItem key={booking.id} booking={booking}></BookingItem>
          ))}
        </div>
        {/* Barbershops */}
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
