import { Barbershop } from "@prisma/client"
import { Card, CardContent } from "./ui/card"
import Image from "next/image"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { StarIcon } from "lucide-react"
import Link from "next/link"

interface BarberShopItemProps {
  barbershop: Barbershop
}

const BarbershopItem = ({ barbershop }: BarberShopItemProps) => {
  return (
    <Card className="min-w-32 p-0 md:min-w-52 lg:min-w-60">
      <CardContent className="p-0">
        <div className="relative h-32 w-full md:h-48 lg:h-56">
          <Image
            src={barbershop.imageUrl}
            alt={barbershop.name}
            fill
            sizes="(min-width: 1024px) 240px, (min-width: 768px) 208px, 128px"
            className="rounded-xl object-cover"
          />

          <Badge
            className="bg-secondary/80 absolute top-2 right-2 space-x-1 md:top-3 md:right-3 md:px-2.5 md:py-1"
            variant="secondary"
          >
            <StarIcon
              size={12}
              className="fill-primary text-primary md:size-3.5"
            ></StarIcon>
            <p className="text-xs font-semibold md:text-sm">5,0</p>
          </Badge>
        </div>
        <div className="px-2 py-2 md:px-3 md:py-4">
          <h3 className="truncate text-sm font-semibold md:text-lg">
            {barbershop.name}
          </h3>
          <p className="truncate text-xs text-gray-400 md:text-base">
            {barbershop.address}
          </p>
          <Button
            variant="outline"
            className="mt-2 w-full py-3 text-sm md:mt-4 md:py-5 md:text-base"
          >
            <Link href={`/barbershops/${barbershop.id}`}>Reservar</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default BarbershopItem
