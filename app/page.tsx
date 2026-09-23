import Header from "./components/header"
import Image from "next/image"
import { prisma } from "./_lib/prisma"
import { unstable_cache } from "next/cache"
import ServiceCard from "./components/service-card"
import RecommendedCarousel from "./components/recommended-carousel"
import BookingItem from "./components/booking-item"
import { getServerSession } from "next-auth"
import { authOptions } from "./_lib/auth"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getConfirmedBookings } from "./_data/get-confirmed-bookings"
import Carousel from "./components/carousel"

// Barbershop data rarely changes — cache across requests instead of
// hitting the DB on every single homepage view.
const getCachedBarbershop = unstable_cache(
  async () => prisma.barbershop.findFirst(),
  ["barbershop"],
  { revalidate: 3600 },
)

// Services change rarely too — same treatment.
const getCachedServices = unstable_cache(
  async () =>
    prisma.barbershopService.findMany({
      orderBy: { name: "asc" },
    }),
  ["barbershop-services"],
  { revalidate: 3600 },
)

// Active employees + their reviews change more often (new reviews come in
// regularly), so cache for a shorter window rather than not at all.
const getCachedEmployees = unstable_cache(
  async () =>
    prisma.employee.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, image: true } },
        reviews: { select: { rating: true } },
      },
    }),
  ["active-employees"],
  { revalidate: 300 },
)

export default async function Home() {
  const session = await getServerSession(authOptions)

  // None of these four depend on each other, so run them concurrently
  // instead of waiting on each sequentially.
  const [barbershop, employees, services, confirmedBookings] =
    await Promise.all([
      getCachedBarbershop(),
      getCachedEmployees(),
      getCachedServices(),
      getConfirmedBookings(),
    ])

  const employeesSerialized = employees.map((employee) => {
    const ratingCount = employee.reviews.length
    const averageRating =
      ratingCount > 0
        ? employee.reviews.reduce((acc, review) => acc + review.rating, 0) /
          ratingCount
        : null

    return {
      id: employee.id,
      name: employee.user.name ?? "Funcionário",
      imageUrl: employee.imageUrl ?? employee.user.image ?? null,
      averageRating,
      ratingCount,
    }
  })

  const servicesSerialized = services.map((service) => ({
    ...service,
    price: Number(service.price),
  }))

  const hasBookings = confirmedBookings.length > 0

  return (
    <div>
      {/* Header */}
      <Header></Header>

      <div className="p-4 md:px-8 lg:px-16 lg:pt-14 xl:px-32">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-24 xl:gap-32">
          {/* Left column */}
          <div className="mt-2 min-w-0">
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

            {/* Hero message */}
            <div className="mt-6 space-y-2 rounded-2xl border p-5 lg:mt-10 lg:p-8">
              <h1 className="text-lg font-bold lg:text-2xl">
                Bem-vindo{barbershop ? ` à ${barbershop.name}` : ""}!
              </h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Estilo, precisão e cuidado em cada detalhe. Agende seu horário
                com os melhores profissionais e viva a experiência que você
                merece.
              </p>
            </div>

            {hasBookings ? (
              <>
                {/* Schedule */}
                <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase md:mt-12 md:mb-3 md:text-base">
                  Agendamentos
                </h2>
                <div className="flex w-full max-w-full gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
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
                  priority
                  className="object-contain"
                />
              </div>
            )}
          </div>

          {/* Right column */}
          <div>
            <h2 className="mb-2 text-xs font-bold text-gray-400 uppercase md:mb-3 md:text-base">
              Funcionários recomendados
            </h2>
            <RecommendedCarousel
              employees={employeesSerialized}
            ></RecommendedCarousel>
          </div>
        </div>

        {/* Populares */}
        <h2 className="mt-5 mb-2 text-xs font-bold text-gray-400 uppercase md:mt-12 md:mb-3 md:text-base lg:mt-16">
          Nossos serviços
        </h2>
        <Carousel>
          {servicesSerialized.map((service) => (
            <ServiceCard key={service.id} service={service}></ServiceCard>
          ))}
        </Carousel>
      </div>
    </div>
  )
}
