import { notFound } from "next/navigation"
import { requireAtendente } from "@/app/_lib/require-admin"
import { prisma } from "@/app/_lib/prisma"
import AtendenteHeader from "@/app/components/atendente-header"
import WalkInBookingForm from "@/app/components/walk-in-booking-form"

// TODO(Phase 4b): this page moves to /b/[slug]/atendente and gets the shop
// from the URL. Until then, use the first shop where the user is staff, or
// the oldest active shop for global ADMINs without a membership (the old
// singleton behaviour).
const getAtendenteShop = async (userId: string) => {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      role: { in: ["ADMIN", "ATENDENTE"] },
      barbershop: { status: "ACTIVE" },
    },
    orderBy: { createdAt: "asc" },
    select: { barbershop: { select: { id: true, slug: true } } },
  })

  if (membership) return membership.barbershop

  return prisma.barbershop.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: { id: true, slug: true },
  })
}

const AtendenteBookingPage = async () => {
  const user = await requireAtendente()

  const barbershop = await getAtendenteShop(user.id)

  if (!barbershop) {
    notFound()
  }

  const services = await prisma.barbershopService.findMany({
    where: { barbershopId: barbershop.id },
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

        <WalkInBookingForm
          services={servicesSerialized}
          slug={barbershop.slug}
        />
      </div>
    </>
  )
}

export default AtendenteBookingPage
