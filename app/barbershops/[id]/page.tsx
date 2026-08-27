import { prisma } from "@/app/_lib/prisma"
import Header from "@/app/components/header"
import PhoneItem from "@/app/components/phone-item"
import ServiceItem from "@/app/components/service-item"
import SidebarSheet from "@/app/components/sidebar-sheet"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent } from "@/app/components/ui/card"
import { Sheet, SheetTrigger } from "@/app/components/ui/sheet"
import { ChevronLeftIcon, MapPinIcon, MenuIcon, StarIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

interface BarberShopPageProps {
  params: Promise<{
    id: string
  }>
}

const BUSINESS_HOURS = [
  { day: "Segunda", hours: "Fechado" },
  { day: "Terça-Feira", hours: "09:00 - 21:00" },
  { day: "Quarta-Feira", hours: "09:00 - 21:00" },
  { day: "Quinta-Feira", hours: "09:00 - 21:00" },
  { day: "Sexta-Feira", hours: "09:00 - 21:00" },
  { day: "Sábado", hours: "08:00 - 17:00" },
  { day: "Domingo", hours: "Fechado" },
]

const BarberShopPage = async ({ params }: BarberShopPageProps) => {
  const { id } = await params

  const barbershop = await prisma.barbershop.findUnique({
    where: {
      id,
    },
    include: {
      services: true,
    },
  })

  if (!barbershop) {
    return notFound()
  }

  // Convert Decimal fields to number so they can be passed to Client Components
  const barbershopSerialized = {
    ...barbershop,
    services: barbershop.services.map((service) => ({
      ...service,
      price: Number(service.price),
    })),
  }

  return (
    <>
      <Header></Header>
      <div className="lg:mx-auto lg:max-w-360 lg:p-8">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8">
          {/* Main column */}
          <div className="lg:col-start-1">
            {/* Image */}
            <div className="relative h-62.5 w-full lg:h-96 lg:overflow-hidden lg:rounded-xl">
              <Image
                src={barbershopSerialized.imageUrl}
                alt={barbershopSerialized.name}
                fill
                sizes="(min-width: 1024px) 700px, 100vw"
                className="object-cover"
              />

              <Button
                size="icon"
                variant="secondary"
                className="absolute top-3 left-3 cursor-pointer lg:hidden"
              >
                <Link href="/">
                  <ChevronLeftIcon></ChevronLeftIcon>
                </Link>
              </Button>

              <Sheet>
                <SheetTrigger
                  render={
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-3 right-3 cursor-pointer lg:hidden"
                    >
                      <MenuIcon></MenuIcon>
                    </Button>
                  }
                ></SheetTrigger>
                <SidebarSheet></SidebarSheet>
              </Sheet>
            </div>

            {/* Info */}
            <div className="border-b p-4 lg:flex lg:items-start lg:justify-between lg:border-b-0 lg:p-0 lg:pt-4">
              <div>
                <h1 className="mb-3 text-xl font-bold lg:text-2xl">
                  {barbershopSerialized.name}
                </h1>
                <div className="mb-2 flex items-center gap-2">
                  <MapPinIcon className="text-primary" size={18}></MapPinIcon>
                  <p className="text-sm">{barbershopSerialized.address}</p>
                </div>
              </div>

              <Card className="mt-2 w-fit p-0 lg:mt-0">
                <CardContent className="flex items-center gap-2 px-3 py-2">
                  <StarIcon
                    className="text-primary fill-primary"
                    size={18}
                  ></StarIcon>
                  <div>
                    <p className="text-sm font-semibold">5,0</p>
                    <p className="text-xs text-gray-400">889 avaliações</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sobre nós - mobile position (hidden on lg, shown in sidebar instead) */}
            <div className="space-y-2 border-b p-4 lg:hidden">
              <h3 className="text-base font-bold text-gray-400 uppercase">
                Sobre nós
              </h3>
              <p className="text-justify text-sm">
                {barbershopSerialized.description}
              </p>
            </div>

            {/* Services */}
            <div className="space-y-2 border-b p-4 lg:border-b-0 lg:p-0 lg:pt-8">
              <h3 className="mb-3 text-base font-bold text-gray-400 uppercase">
                Serviços
              </h3>
              <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                {barbershopSerialized.services.map((service) => (
                  <ServiceItem
                    key={service.id}
                    service={service}
                    barbershop={barbershopSerialized}
                  ></ServiceItem>
                ))}
              </div>
            </div>

            {/* Contact - mobile position (hidden on lg, shown in sidebar instead) */}
            <div className="space-y-3 p-4 lg:hidden">
              {barbershopSerialized.phones.map((phone, index) => (
                <PhoneItem key={`${phone}-${index}`} phone={phone} />
              ))}
            </div>
          </div>

          {/* Sidebar - desktop only */}
          <Card className="hidden lg:col-start-2 lg:block lg:rounded-xl lg:p-0">
            <CardContent className="p-4">
              <div className="relative flex h-36 w-full items-end">
                <Image
                  src="/map.png"
                  fill
                  className="rounded-xl"
                  alt="Localização da Barbearia"
                ></Image>

                <Card className="z-10 mx-3 mb-3 w-full rounded-xl">
                  <CardContent className="flex items-center gap-3 px-3 py-1">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={barbershopSerialized.imageUrl}
                        alt={barbershopSerialized.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">
                        {barbershopSerialized.name}
                      </h3>
                      <p className="truncate text-xs text-gray-400">
                        {barbershopSerialized.address}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-bold text-gray-400 uppercase">
                  Sobre nós
                </h3>
                <p className="text-justify text-sm">
                  {barbershopSerialized.description}
                </p>
              </div>

              <div className="mt-4 space-y-3 border-t border-gray-400/20 pt-5">
                {barbershopSerialized.phones.map((phone, index) => (
                  <PhoneItem key={`${phone}-sidebar-${index}`} phone={phone} />
                ))}
              </div>

              <div className="mt-4 border-t border-gray-400/20 pt-5">
                {BUSINESS_HOURS.map(({ day, hours }) => (
                  <div
                    key={day}
                    className="flex items-center justify-between py-2"
                  >
                    <p className="text-sm text-gray-400">{day}</p>
                    <p className="text-sm font-medium">{hours}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

export default BarberShopPage
