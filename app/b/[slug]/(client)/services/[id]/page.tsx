import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { prisma } from "@/app/_lib/prisma"
import { getTenant } from "@/app/_lib/tenant"
import { getViewerBookingBlocked } from "@/app/_lib/customer-booking"
import Header from "@/app/components/header"
import BackButton from "@/app/components/back-button"
import ServiceCard from "@/app/components/service-card"
import EmployeeItem from "@/app/components/employee-item"

interface ServicePageProps {
  params: Promise<{ slug: string; id: string }>
}

// Scoped to the shop: a service id from another shop is a 404
const getShopService = cache((barbershopId: string, id: string) =>
  prisma.barbershopService.findFirst({
    where: { id, barbershopId },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      imageUrl: true,
      durationInMinutes: true,
      employees: {
        where: { employee: { barbershopId, isActive: true } },
        select: {
          employee: {
            select: {
              id: true,
              imageUrl: true,
              user: { select: { name: true, image: true } },
              reviews: { select: { rating: true } },
            },
          },
        },
      },
    },
  }),
)

export const generateMetadata = async ({
  params,
}: ServicePageProps): Promise<Metadata> => {
  const { slug, id } = await params
  const shop = await getTenant(slug)
  const service = await getShopService(shop.id, id)

  return service
    ? { title: service.name, description: service.description }
    : {}
}

const ServicePage = async ({ params }: ServicePageProps) => {
  const { slug, id } = await params
  const shop = await getTenant(slug)

  const [service, bookingBlocked] = await Promise.all([
    getShopService(shop.id, id),
    getViewerBookingBlocked(shop.id),
  ])

  if (!service) {
    notFound()
  }

  const { employees, ...rest } = service
  const serviceSerialized = { ...rest, price: Number(service.price) }

  const employeesSerialized = employees.map(({ employee }) => {
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

  return (
    <>
      <Header />
      <div className="space-y-8 p-4 lg:mx-auto lg:max-w-5xl lg:p-8">
        <div className="relative flex justify-center pt-12">
          <BackButton href={`/b/${shop.slug}`} className="top-0 left-0" />
          <div className="w-full max-w-sm">
            <ServiceCard
              service={serviceSerialized}
              slug={shop.slug}
              bookingBlocked={bookingBlocked}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase md:text-base">
            Profissionais
          </h2>
          {employeesSerialized.length === 0 ? (
            <p className="text-sm text-gray-400">
              Nenhum profissional disponível para este serviço.
            </p>
          ) : (
            <div className="flex gap-5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {employeesSerialized.map((employee) => (
                <EmployeeItem
                  key={employee.id}
                  employee={employee}
                  slug={shop.slug}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ServicePage
