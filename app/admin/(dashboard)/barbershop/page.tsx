import { prisma } from "@/app/_lib/prisma"
import { requireAdmin } from "@/app/_lib/require-admin"
import BarbershopForm from "@/app/components/barbershop-form"

const AdminBarbershopPage = async () => {
  await requireAdmin()

  // read straight from the DB (not the cached fetcher) so the form is never stale
  const barbershop = await prisma.barbershop.findFirst({
    select: {
      name: true,
      description: true,
      address: true,
      imageUrl: true,
      instagramUrl: true,
      phones: true,
    },
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-xl font-bold lg:text-2xl xl:text-3xl">Barbearia</h1>
        <p className="text-muted-foreground text-sm xl:text-base">
          Edite as informações que aparecem para os clientes.
        </p>
      </div>

      {barbershop ? (
        <BarbershopForm barbershop={barbershop} />
      ) : (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Nenhuma barbearia cadastrada.
        </p>
      )}
    </div>
  )
}

export default AdminBarbershopPage
