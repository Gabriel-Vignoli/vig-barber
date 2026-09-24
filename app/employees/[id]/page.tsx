import { prisma } from "@/app/_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/_lib/auth"
import { unstable_cache } from "next/cache"
import Header from "@/app/components/header"
import PhoneItem from "@/app/components/phone-item"
import ServiceItem from "@/app/components/service-item"
import EmployeeReviews from "@/app/components/employee-reviews"
import BackButton from "@/app/components/back-button"
import ViewLocationButton from "@/app/components/view-location-button"
import { Card, CardContent } from "@/app/components/ui/card"
import { StarIcon } from "lucide-react"
import { Weekday } from "@prisma/client"
import Image from "next/image"
import { notFound } from "next/navigation"

interface EmployeePageProps {
  params: Promise<{
    id: string
  }>
}

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

// Barbershop data rarely changes, so cache it across requests instead of
// hitting the DB on every single page view. Revalidates every hour.
const getCachedBarbershop = unstable_cache(
  async () => prisma.barbershop.findFirst(),
  ["barbershop"],
  { revalidate: 3600 },
)

const EmployeePage = async ({ params }: EmployeePageProps) => {
  const { id } = await params
  const session = await getServerSession(authOptions)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserId = (session?.user as any)?.id ?? null

  // These three queries don't depend on each other's results, so run them
  // concurrently instead of waiting on each one sequentially.
  const [employee, barbershop, reviewableBookingCandidate] = await Promise.all([
    prisma.employee.findUnique({
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
    }),
    getCachedBarbershop(),
    currentUserId
      ? prisma.booking.findFirst({
          where: {
            employeeId: id,
            userId: currentUserId,
            bookingDate: { lt: new Date() },
            status: { not: "CANCELLED" },
            review: null,
          },
          orderBy: { bookingDate: "desc" },
        })
      : Promise.resolve(null),
  ])

  if (!employee || !barbershop) {
    return notFound()
  }

  const hasReviewed = currentUserId
    ? employee.reviews.some((review) => review.userId === currentUserId)
    : false

  const reviewableBooking = hasReviewed ? null : reviewableBookingCandidate

  const employeeName = employee.user.name ?? "Funcionário"
  const employeeImage = employee.imageUrl ?? employee.user.image ?? null

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
      <Header />
      <div className="lg:mx-auto lg:max-w-360 lg:p-8">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8">
          {/* Main column */}
          <div className="lg:col-start-1">
            {/* Image */}
            <div className="bg-muted relative flex h-62.5 w-full items-center justify-center lg:mx-auto lg:h-96 lg:max-w-md lg:overflow-hidden lg:rounded-xl">
              {employeeImage ? (
                <Image
                  src={employeeImage}
                  alt={employeeName}
                  fill
                  sizes="(min-width: 1024px) 448px, 100vw"
                  className="object-cover"
                />
              ) : (
                <p className="text-muted-foreground px-4 text-center text-sm">
                  Esse barbeiro ainda não possui uma imagem
                </p>
              )}

              <BackButton href="/" />
            </div>

            {/* Info */}
            <div className="border-b p-4 lg:flex lg:items-start lg:justify-between lg:border-b-0 lg:p-0 lg:pt-4">
              <div>
                <h1 className="mb-3 text-xl font-bold lg:text-2xl xl:text-3xl">
                  {employeeName}
                </h1>
              </div>

              <div className="mt-2 w-fit lg:mt-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold lg:text-base">
                    {averageRating !== null
                      ? averageRating.toFixed(1).replace(".", ",")
                      : "Novo"}
                  </p>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const starValue = index + 1
                      const rating = averageRating ?? 0

                      if (rating >= starValue) {
                        return (
                          <StarIcon
                            key={index}
                            className="fill-yellow-400 text-yellow-400"
                            size={18}
                            strokeWidth={1}
                          />
                        )
                      }

                      if (rating >= starValue - 0.5) {
                        return (
                          <div key={index} className="relative">
                            <StarIcon
                              className="text-gray-300"
                              size={18}
                              strokeWidth={1}
                            />
                            <div className="absolute inset-0 w-1/2 overflow-hidden">
                              <StarIcon
                                className="fill-yellow-400 text-yellow-400"
                                size={18}
                                strokeWidth={1}
                              />
                            </div>
                          </div>
                        )
                      }

                      return (
                        <StarIcon
                          key={index}
                          className="text-gray-300"
                          size={18}
                          strokeWidth={1}
                        />
                      )
                    })}
                  </div>
                </div>
                <p className="text-left text-xs text-gray-400 lg:text-sm">
                  {ratingCount > 0
                    ? `${ratingCount} avaliações`
                    : "Sem avaliações"}
                </p>
              </div>
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
                      employeeName={employeeName}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="space-y-3 border-b p-4 lg:border-b-0 lg:p-0 lg:pt-8">
              <EmployeeReviews
                employeeId={employee.id}
                reviews={employee.reviews}
                currentUserId={currentUserId}
                reviewableBookingId={reviewableBooking?.id ?? null}
              />
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
                />

                <Card className="z-10 mx-3 mb-3 w-full rounded-xl">
                  <CardContent className="flex flex-col items-center gap-3 px-3 py-1">
                    <div className="flex gap-3">
                      <div className="bg-muted relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
                        {barbershop.imageUrl ? (
                          <Image
                            src={barbershop.imageUrl}
                            alt={barbershop.name}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{barbershop.name}</h3>
                        <p className="truncate text-xs text-gray-400">
                          {barbershop.address}
                        </p>
                      </div>
                    </div>

                    <ViewLocationButton href="https://www.google.com.br/maps/@-21.3657277,-46.935593,15z?hl=pt-BR&entry=ttu&g_ep=EgoyMDI2MDgyNi4wIKXMDSoASAFQAw%3D%3D" />
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
                      <p className="text-sm">{WEEKDAY_LABELS[weekday]}</p>
                      <p className="text-sm font-medium">{hours}</p>
                    </div>
                  )
                })}
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
