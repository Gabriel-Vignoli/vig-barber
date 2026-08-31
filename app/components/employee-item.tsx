import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { StarIcon } from "lucide-react"

interface EmployeeItemProps {
  employee: {
    id: string
    name: string
    imageUrl: string
    averageRating: number | null
    ratingCount: number
  }
}

const EmployeeItem = ({ employee }: EmployeeItemProps) => {
  return (
    <Card className="w-56 shrink-0 p-0 md:w-72">
      <CardContent className="p-0">
        <div className="relative h-36 w-full md:h-52 lg:h-64">
          <Image
            src={employee.imageUrl}
            alt={employee.name}
            fill
            sizes="(min-width: 768px) 288px, 224px"
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
            <p className="text-xs font-semibold">
              {employee.averageRating !== null
                ? employee.averageRating.toFixed(1).replace(".", ",")
                : "Novo"}
            </p>
          </Badge>
        </div>
        <div className="px-2 py-2 md:py-3">
          <h3 className="truncate font-semibold">{employee.name}</h3>
          <p className="truncate text-sm text-gray-400">
            {employee.ratingCount > 0
              ? `${employee.ratingCount} avaliações`
              : "Ainda sem avaliações"}
          </p>
          <Button
            variant="outline"
            className="mt-2 w-full py-3 text-sm md:mt-3 md:py-4 md:text-base"
          >
            <Link href={`/employees/${employee.id}`}>Reservar</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default EmployeeItem
