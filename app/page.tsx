import Header from "./components/header"
import Image from "next/image"
import { prisma } from "./_lib/prisma"
import BarbershopItem from "./components/barbershop-item"
import RecommendedCarousel from "./components/recommended-carousel"
import BookingItem from "./components/booking-item"
import Search from "./components/search"
import { getServerSession } from "next-auth"
import { authOptions } from "./_lib/auth"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getConfirmedBookings } from "./_data/get-confirmed-bookings"
import Carousel from "./components/carousel"

export default async function Home() {
  const session = await getServerSession(authOptions)
  const popularBarbershops = await prisma.barbershop.findMany({
    orderBy: {
      name: "desc",
    },
  })

  const confirmedBookings = await getConfirmedBookings()
  const hasBookings = confirmedBookings.length > 0

  return (
    <div>
      {/* Header */}
      <Header></Header>

      <div className="p-4 md:px-8 lg:px-16 lg:pt-14 xl:px-32">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-24 xl:gap-32">
          {/* Left column */}
          <div className="mt-2">
            <h2 className="text-xl md:text-3xl">
              Olá,{" "}
              <span className="font-bold">
                {session?.user ? session.user.name : "usuário, faça seu login"}!
              </span>
            </h2>

            <p>
              <span className="capitalize md:text-lg">
                {format(new Date(), "EEEE, dd", { locale: ptBR })} de{" "}
                <span className="caitalize md:text-lg">
                  {format(new Date(), "MMMM", { locale: ptBR })}
                </span>
              </span>
            </p>

            {/* Search */}
            <div className="mt-6 lg:mt-10">
              <Search></Search>
            </div>

            {hasBookings ? (
              <>
                {/* Schedule */}
                <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase md:mt-12 md:mb-3 md:text-base">
                  Agendamentos
                </h2>
                <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                  {confirmedBookings.map((booking) => (
                    <BookingItem
                      key={booking.id}
                      booking={booking}
                    ></BookingItem>
                  ))}
                </div>
              </>
            ) : (
              /* Banner - shown instead of the schedule when there are no bookings */
              <div className="relative mt-4 h-37.5 w-full lg:mt-8 lg:h-48">
                <Image
                  src="/banner-01.png"
                  alt="Banner 01"
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>

          {/* Right column - Recomendados */}
          <div>
            <h2 className="mb-2 text-xs font-bold text-gray-400 uppercase md:mb-3 md:text-base">
              Recomendados
            </h2>
            <RecommendedCarousel></RecommendedCarousel>
          </div>
        </div>

        {/* Populares */}
        <h2 className="mt-5 mb-2 text-xs font-bold text-gray-400 uppercase md:mt-12 md:mb-3 md:text-base lg:mt-16">
          Populares
        </h2>
        <Carousel>
          {popularBarbershops.map((barbershop) => (
            <BarbershopItem
              key={barbershop.id}
              barbershop={barbershop}
            ></BarbershopItem>
          ))}
        </Carousel>
      </div>
    </div>
  )
}
