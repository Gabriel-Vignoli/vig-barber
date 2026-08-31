import { prisma } from "@/app/_lib/prisma"
import Header from "@/app/components/header"
import PhoneItem from "@/app/components/phone-item"
import ServiceItem from "@/app/components/service-item"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent } from "@/app/components/ui/card"
import { ChevronLeftIcon, MapPinIcon, StarIcon } from "lucide-react"
import { Weekday } from "@prisma/client"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

interface EmployeePageProps {
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

const WEEKDAY_ORDER: Weekday[] = [
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
  Weekday.SUNDAY,
]

const WEEKDAY_LABELS: Record<Weekday, string> = {
  MONDAY: "Segunda",
  TUESDAY: "Terça-Feira",
  WEDNESDAY: "Quarta-Feira",
  THURSDAY: "Quinta-Feira",
  FRIDAY: "Sexta-Feira",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
}

const EmployeePage = async ({ params }: EmployeePageProps) => {
  const { id } = await params

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, image: true } },
      services: { include: { service: true } },
      schedules: true,
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  const barbershop = await prisma.barbershop.findFirst()

  if (!employee || !barbershop) {
    return notFound()
  }

  const employeeName = employee.user.name ?? "Funcionário"
  const employeeImage =
    employee.imageUrl ?? employee.user.image ?? "/avatar-placeholder.png"

  const servicesSerialized = employee.services.map(({ service }) => ({
    ...service,
    price: Number(service.price),
  }))

  const ratingCount = employee.reviews.length
  const averageRating =
    ratingCount > 0
      ? employee.reviews.reduce((acc, review) => acc + review.rating, 0) /
        ratingCount
      : null

  const scheduleByWeekday = new Map(
    employee.schedules.map((schedule) => [schedule.weekday, schedule]),
  )

  return (
    <>
      <Header></Header>
      <div className="lg:mx-auto lg:max-w-360 lg:p-8">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8">
          {/* Main column */}
          <div className="lg:col-start-1">
            {/* Image */}
            <div className="relative h-62.5 w-full lg:mx-auto lg:h-96 lg:max-w-md lg:overflow-hidden lg:rounded-xl">
              <Image
                src={employeeImage}
                alt={employeeName}
                fill
                sizes="(min-width: 1024px) 448px, 100vw"
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
            </div>

            {/* Info */}
            <div className="border-b p-4 lg:flex lg:items-start lg:justify-between lg:border-b-0 lg:p-0 lg:pt-4">
              <div>
                <h1 className="mb-3 text-xl font-bold lg:text-2xl xl:text-3xl">
                  {employeeName}
                </h1>
                <div className="mb-2 flex items-center gap-2">
                  <MapPinIcon className="text-primary" size={18}></MapPinIcon>
                  <p className="text-sm lg:text-base">{barbershop.address}</p>
                </div>
              </div>

              <Card className="mt-2 w-fit p-0 lg:mt-0">
                <CardContent className="flex items-center gap-2 px-3 py-2">
                  <StarIcon
                    className="text-primary fill-primary"
                    size={18}
                  ></StarIcon>
                  <div>
                    <p className="text-sm font-semibold lg:text-base">
                      {averageRating !== null
                        ? averageRating.toFixed(1).replace(".", ",")
                        : "Novo"}
                    </p>
                    <p className="text-xs text-gray-400 lg:text-sm">
                      {ratingCount > 0
                        ? `${ratingCount} avaliações`
                        : "Sem avaliações"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sobre - employee bio, always visible */}
            <div className="space-y-2 border-b p-4">
              <h3 className="text-base font-bold text-gray-400 uppercase xl:text-lg">
                Sobre
              </h3>
              <p className="text-justify text-sm xl:text-base">
                {employee.bio ??
                  "Este profissional ainda não adicionou uma bio."}
              </p>
            </div>

            {/* Horários - employee's own working hours, always visible */}
            <div className="space-y-2 border-b p-4">
              <h3 className="text-base font-bold text-gray-400 uppercase xl:text-lg">
                Horários de trabalho
              </h3>
              <div>
                {WEEKDAY_ORDER.map((weekday) => {
                  const schedule = scheduleByWeekday.get(weekday)
                  const hours =
                    !schedule || schedule.isDayOff
                      ? "Fechado"
                      : `${schedule.startTime} - ${schedule.endTime}`

                  return (
                    <div
                      key={weekday}
                      className="flex items-center justify-between py-2"
                    >
                      <p className="text-sm xl:text-base">
                        {WEEKDAY_LABELS[weekday]}
                      </p>
                      <p className="text-sm font-medium xl:text-base">
                        {hours}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Services */}
            <div className="space-y-2 border-b p-4 lg:border-b-0 lg:p-0 lg:pt-8">
              <h3 className="mb-3 text-base font-bold text-gray-400 uppercase xl:text-lg">
                Serviços
              </h3>
              {servicesSerialized.length === 0 ? (
                <p className="text-sm text-gray-400 xl:text-base">
                  Este profissional ainda não possui serviços cadastrados.
                </p>
              ) : (
                <div className="space-y-3 xl:grid xl:grid-cols-2 xl:gap-4 xl:space-y-0">
                  {servicesSerialized.map((service) => (
                    <ServiceItem
                      key={service.id}
                      service={service}
                      barbershop={{ name: barbershop.name }}
                      employeeId={employee.id}
                    ></ServiceItem>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="space-y-3 border-b p-4 lg:border-b-0 lg:p-0 lg:pt-8">
              <h3 className="mb-3 text-base font-bold text-gray-400 uppercase xl:text-lg">
                Avaliações
              </h3>
              {employee.reviews.length === 0 ? (
                <p className="text-sm xl:text-base">
                  Este profissional ainda não possui avaliações.
                </p>
              ) : (
                <div className="space-y-3">
                  {employee.reviews.map((review) => (
                    <Card key={review.id} className="p-0">
                      <CardContent className="space-y-1 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">
                            {review.user.name ?? "Cliente"}
                          </p>
                          <div className="flex items-center gap-1">
                            <StarIcon
                              className="text-primary fill-primary"
                              size={14}
                            ></StarIcon>
                            <p className="text-sm font-medium">
                              {review.rating.toFixed(1).replace(".", ",")}
                            </p>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-400">
                            {review.comment}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Contact - mobile position (hidden on lg, shown in sidebar instead) */}
            <div className="space-y-3 p-4 lg:hidden">
              {barbershop.phones.map((phone, index) => (
                <PhoneItem key={`${phone}-${index}`} phone={phone} />
              ))}
            </div>
          </div>

          {/* Sidebar - desktop only - barbershop info */}
          <Card className="hidden lg:col-start-2 lg:block lg:rounded-xl lg:p-0">
            <CardContent className="p-4">
              <h3 className="mb-2 text-sm font-bold text-gray-400 uppercase">
                Nossa localização
              </h3>
              <div className="relative flex h-44 w-full items-end">
                <Image
                  src="/map.png"
                  fill
                  className="rounded-xl"
                  alt="Localização da Barbearia"
                ></Image>

                <Card className="z-10 mx-3 mb-3 w-full rounded-xl">
                  <CardContent className="flex flex-col items-center gap-3 px-3 py-1">
                    <div className="flex gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={barbershop.imageUrl}
                          alt={barbershop.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{barbershop.name}</h3>
                        <p className="truncate text-xs text-gray-400">
                          {barbershop.address}
                        </p>
                      </div>
                    </div>

                    <Link
                      href="https://www.google.com.br/maps/@-21.3657277,-46.935593,15z?hl=pt-BR&entry=ttu&g_ep=EgoyMDI2MDgyNi4wIKXMDSoASAFQAw%3D%3D"
                      target="_blank"
                    >
                      <Button className="cursor-pointer">
                        Ver Localização
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 space-y-2">
                <h3 className="text-sm font-bold text-gray-400 uppercase">
                  Sobre nós
                </h3>
                <p className="text-justify text-sm">{barbershop.description}</p>
              </div>

              <div className="mt-8 border-t border-gray-400/20 pt-8">
                <h3 className="text-sm font-bold text-gray-400 uppercase">
                  Horário de funcionamento
                </h3>
                {BUSINESS_HOURS.map(({ day, hours }) => (
                  <div
                    key={day}
                    className="flex items-center justify-between py-2"
                  >
                    <p className="text-sm">{day}</p>
                    <p className="text-sm font-medium">{hours}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-3 border-t border-gray-400/20 pt-8">
                <h3 className="text-sm font-bold text-gray-400 uppercase">
                  Contato
                </h3>
                {barbershop.phones.map((phone, index) => (
                  <PhoneItem key={`${phone}-sidebar-${index}`} phone={phone} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

export default EmployeePage
