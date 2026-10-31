import Image from "next/image"
import { getServerSession } from "next-auth"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { authOptions } from "@/app/_lib/auth"
import { getTenant } from "@/app/_lib/tenant"
import { getViewerBookingBlocked } from "@/app/_lib/customer-booking"
import { getShopServices } from "@/app/_data/get-shop-services"
import { getShopEmployees } from "@/app/_data/get-shop-employees"
import { getConfirmedBookings } from "@/app/_data/get-confirmed-bookings"
import Header from "@/app/components/header"
import ServiceCard from "@/app/components/service-card"
import RecommendedCarousel from "@/app/components/recommended-carousel"
import BookingItem from "@/app/components/booking-item"
import Carousel from "@/app/components/carousel"

interface ShopHomeProps {
  params: Promise<{ slug: string }>
}

const ShopHome = async ({ params }: ShopHomeProps) => {
  const { slug } = await params
  const shop = await getTenant(slug)

  // None of these depend on each other, so run them concurrently
  const [session, employees, services, confirmedBookings, bookingBlocked] =
    await Promise.all([
      getServerSession(authOptions),
      getShopEmployees(shop.id),
      getShopServices(shop.id),
      getConfirmedBookings(shop.id),
      getViewerBookingBlocked(shop.id),
    ])

  const hasBookings = confirmedBookings.length > 0

  return (
    <div>
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
            <div className="mt-6 overflow-hidden rounded-2xl border lg:mt-10">
              {shop.bannerUrl && (
                <div className="relative h-32 w-full lg:h-44">
                  <Image
                    src={shop.bannerUrl}
                    alt={`Banner da ${shop.name}`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex items-start gap-4 p-5 lg:p-8">
                {shop.logoUrl && (
                  <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-full border lg:size-16">
                    <Image
                      src={shop.logoUrl}
                      alt={`Logo da ${shop.name}`}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <h1 className="text-lg font-bold lg:text-2xl">
                    Bem-vindo à {shop.name}!
                  </h1>
                  <p className="text-muted-foreground text-sm lg:text-base">
                    Estilo, precisão e cuidado em cada detalhe. Agende seu
                    horário com os melhores profissionais e viva a experiência
                    que você merece.
                  </p>
                </div>
              </div>
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
                  sizes="(min-width: 1024px) 50vw, 100vw"
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
              employees={employees}
              slug={shop.slug}
            ></RecommendedCarousel>
          </div>
        </div>

        {/* Populares */}
        <h2 className="mt-5 mb-2 text-xs font-bold text-gray-400 uppercase md:mt-12 md:mb-3 md:text-base lg:mt-16">
          Nossos serviços
        </h2>
        <Carousel>
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              slug={shop.slug}
              bookingBlocked={bookingBlocked}
            ></ServiceCard>
          ))}
        </Carousel>
      </div>
    </div>
  )
}

export default ShopHome
