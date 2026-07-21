import { prisma } from "@/app/_lib/prisma"
import { Button } from "@/app/components/ui/button"
import { ChevronLeftIcon, MapPinIcon, MenuIcon, StarIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

interface BarberShopPageProps {
  params: Promise<{
    id: string
  }>
}

const BarberShopPage = async ({ params }: BarberShopPageProps) => {
  const { id } = await params

  const barbershop = await prisma.barbershop.findUnique({
    where: {
      id,
    },
  })

  if (!barbershop) {
    return notFound()
  }

  return (
    <div>
      {/* Image */}
      <div className="relative h-62.5 w-full">
        <Image
          src={barbershop.imageUrl}
          alt={barbershop.name}
          fill
          sizes="100vw"
          className="object-cover"
        />

        <Button
          size="icon"
          variant="secondary"
          className="absolute top-3 left-3"
        >
          <Link href="/">
            <ChevronLeftIcon></ChevronLeftIcon>
          </Link>
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-3 right-3"
        >
          <MenuIcon></MenuIcon>
        </Button>
      </div>
      {/* Info */}
      <div className="border-b p-4">
        <h1 className="mb-3 text-xl font-bold">{barbershop.name}</h1>
        <div className="mb-2 flex items-center gap-2">
          <MapPinIcon className="text-primary" size={18}></MapPinIcon>
          <p className="text-sm">{barbershop.address}</p>
        </div>

        <div className="flex items-center gap-2">
          <StarIcon className="text-primary fill-primary" size={18}></StarIcon>
          <p className="text-sm">5,0 (230 avaliações)</p>
        </div>
      </div>

      <div className="space-y-2 border-b p-4">
        <h3 className="font-bold text-gray-400 uppercase">Sobre nós</h3>
        <p className="text-justify text-sm">{barbershop.description}</p>
      </div>
    </div>
  )
}

export default BarberShopPage
