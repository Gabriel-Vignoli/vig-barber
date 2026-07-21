import { Barbershop } from "@prisma/client"
import { Card, CardContent } from "./ui/card"
import Image from "next/image"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { StarIcon } from "lucide-react"

interface BarberShopItemProps {
  barbershop: Barbershop
}

const BarbershopItem = ({ barbershop }: BarberShopItemProps) => {
  return (
    <Card className="min-w-40 p-0">
      <CardContent className="p-0">
        <div className="relative h-40 w-full">
          <Image
            src={barbershop.imageUrl}
            alt={barbershop.name}
            fill
            sizes="160px"
            className="rounded-xl object-cover"
          />

          <Badge
            className="bg-secondary/80 absolute top-2 right-2 space-x-1"
            variant="secondary"
          >
            <StarIcon
              size={12}
              className="fill-primary text-primary"
            ></StarIcon>
            <p className="text-xs font-semibold">5,0</p>
          </Badge>
        </div>
        <div className="px-2 py-3">
          <h3 className="truncate font-semibold">{barbershop.name}</h3>
          <p className="truncate text-sm text-gray-400">{barbershop.address}</p>
          <Button variant="outline" className="mt-3 w-full py-4">
            Reservar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default BarbershopItem
