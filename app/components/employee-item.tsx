"use client"

import Image from "next/image"
import Link from "next/link"
import { StarIcon } from "lucide-react"
import { Card, CardContent } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"

interface EmployeeItemProps {
  employee: {
    id: string
    name: string
    imageUrl: string | null
    averageRating: number | null
    ratingCount: number
  }
}

const EmployeeItem = ({ employee }: EmployeeItemProps) => {
  if (!employee) return null

  return (
    <Card className="w-48 shrink-0 p-0 md:w-72">
      <CardContent className="p-0">
        <div className="bg-muted relative flex h-36 w-full items-center justify-center overflow-hidden rounded-t-xl md:h-52 lg:h-64">
          {employee.imageUrl ? (
            <Image
              src={employee.imageUrl}
              alt={employee.name}
              fill
              sizes="(min-width: 768px) 288px, 192px"
              className="object-cover"
            />
          ) : (
            <p className="text-muted-foreground px-4 text-center text-xs">
              Esse barbeiro ainda não possui uma imagem
            </p>
          )}

          <Badge
            className="bg-secondary/80 absolute top-2 right-2 space-x-1"
            variant="secondary"
          >
            <StarIcon size={12} className="fill-primary text-primary" />
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
            className="mt-2 w-full cursor-pointer py-3 text-sm md:mt-3 md:py-4 md:text-base"
            nativeButton={false}
            render={(buttonProps) => (
              <Link href={`/employees/${employee.id}`} {...buttonProps}>
                Visualizar
              </Link>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default EmployeeItem
