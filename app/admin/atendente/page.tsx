import { requireAtendente } from "@/app/_lib/require-admin"
import { prisma } from "@/app/_lib/prisma"
import AtendenteHeader from "@/app/components/atendente-header"
import WalkInBookingForm from "@/app/components/walk-in-booking-form"

const AtendenteBookingPage = async () => {
  const user = await requireAtendente()

  const services = await prisma.barbershopService.findMany({
    orderBy: { name: "asc" },
  })

  const servicesSerialized = services.map((service) => ({
    ...service,
    price: Number(service.price),
  }))

  return (
    <>
      <AtendenteHeader atendenteName={user.name ?? "Atendente"} />
      <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-8">
        <div>
          <h1 className="text-xl font-bold lg:text-2xl xl:text-4xl">
            Novo agendamento
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base xl:text-lg">
            Crie um agendamento para um cliente.
          </p>
        </div>

        <WalkInBookingForm services={servicesSerialized} />
      </div>
    </>
  )
}

export default AtendenteBookingPage
