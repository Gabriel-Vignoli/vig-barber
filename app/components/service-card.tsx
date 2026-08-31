import { Card, CardContent } from "./ui/card"
import Image from "next/image"
import { Button } from "./ui/button"
import Link from "next/link"

interface ServiceCardProps {
  service: {
    id: string
    name: string
    description: string
    price: number
    imageUrl: string
  }
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  return (
    <Card className="min-w-32 p-0 md:min-w-52 lg:min-w-60">
      <CardContent className="p-0">
        <div className="relative h-32 w-full md:h-48 lg:h-56">
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            sizes="(min-width: 1024px) 240px, (min-width: 768px) 208px, 128px"
            className="rounded-xl object-cover"
          />
        </div>
        <div className="px-2 py-2 md:px-3 md:py-4">
          <h3 className="truncate text-sm font-semibold md:text-lg">
            {service.name}
          </h3>
          <p className="truncate text-xs text-gray-400 md:text-base">
            {service.description}
          </p>
          <p className="text-primary mt-1 text-sm font-bold md:text-base">
            {Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(service.price)}
          </p>
          <Button
            variant="outline"
            className="mt-2 w-full py-3 text-sm md:mt-4 md:py-5 md:text-base"
          >
            <Link href={`/services/${service.id}`}>Reservar</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ServiceCard
