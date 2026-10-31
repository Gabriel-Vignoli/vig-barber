import { prisma } from "@/app/_lib/prisma"
import { requireShopRole } from "@/app/_lib/tenant"
import BarbershopForm from "@/app/components/barbershop-form"

interface AdminBarbershopPageProps {
  params: Promise<{ slug: string }>
}

const AdminBarbershopPage = async ({ params }: AdminBarbershopPageProps) => {
  const { slug } = await params
  const { shop } = await requireShopRole(slug, ["ADMIN"])

  // read straight from the DB (not the cached tenant) so the form is never stale
  const barbershop = await prisma.barbershop.findUnique({
    where: { id: shop.id },
    select: {
      name: true,
      description: true,
      address: true,
      city: true,
      latitude: true,
      longitude: true,
      logoUrl: true,
      bannerUrl: true,
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
        <BarbershopForm slug={slug} barbershop={barbershop} />
      ) : (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Nenhuma barbearia cadastrada.
        </p>
      )}
    </div>
  )
}

export default AdminBarbershopPage
