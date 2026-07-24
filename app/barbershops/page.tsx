import { prisma } from "../_lib/prisma"
import BarbershopItem from "../components/barbershop-item"
import Header from "../components/header"
import Search from "../components/search"

interface BarbershopsPageProps {
  searchParams: Promise<{
    search?: string
  }>
}

const BarbershopsPage = async ({ searchParams }: BarbershopsPageProps) => {
  const { search } = await searchParams

  const barbershops = await prisma.barbershop.findMany({
    where: search
      ? {
          name: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {},
  })

  return (
    <div>
      <Header></Header>
      <div className="my-6 px-4">
        <Search></Search>
      </div>
      <div className="px-4">
        <h2 className="mt-6 mb-3 text-xs font-bold text-gray-400 uppercase">
          {search ? `Resultados para "${search}"` : "Todas as barbearias"}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {barbershops.map((barbershop) => (
            <BarbershopItem key={barbershop.id} barbershop={barbershop} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default BarbershopsPage
