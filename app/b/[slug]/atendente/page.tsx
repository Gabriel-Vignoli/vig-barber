import { requireShopRole } from "@/app/_lib/tenant"
import { getShopServices } from "@/app/_data/get-shop-services"
import WalkInBookingForm from "@/app/components/walk-in-booking-form"

interface AtendenteBookingPageProps {
  params: Promise<{ slug: string }>
}

const AtendenteBookingPage = async ({ params }: AtendenteBookingPageProps) => {
  const { slug } = await params
  const { shop } = await requireShopRole(slug, ["ATENDENTE", "ADMIN"])

  const services = await getShopServices(shop.id)

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-xl font-bold lg:text-2xl xl:text-4xl">
          Novo agendamento
        </h1>
        <p className="text-muted-foreground text-sm lg:text-base xl:text-lg">
          Crie um agendamento para um cliente.
        </p>
      </div>

      <WalkInBookingForm services={services} slug={slug} />
    </div>
  )
}

export default AtendenteBookingPage
