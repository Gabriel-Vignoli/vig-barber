"use client"

import Image from "next/image"
import Link from "next/link"
import { StarIcon } from "lucide-react"
import { Card, CardContent } from "@/app/components/ui/card"
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
    <Card className="group w-44 shrink-0 overflow-hidden border-0 py-0 shadow-md transition-shadow hover:shadow-xl md:w-60 xl:w-72">
      <CardContent className="p-0">
        <div className="bg-muted relative flex h-56 w-full items-center justify-center overflow-hidden md:h-64 lg:h-72 xl:h-80">
          {employee.imageUrl ? (
            <Image
              src={employee.imageUrl}
              alt={employee.name}
              fill
              sizes="(min-width: 768px) 288px, 176px"
              className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <p className="text-muted-foreground px-4 text-center text-xs">
              Esse barbeiro ainda não possui uma imagem
            </p>
          )}

          {/* Gradient scrim so text stays legible over any photo */}
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/10 to-transparent" />

          {/* Rating badge */}
          <div className="bg-background/90 absolute top-3 right-3 flex items-center gap-1 rounded-full px-2 py-1 backdrop-blur-sm">
            <StarIcon size={12} className="fill-primary text-primary" />
            <p className="text-xs font-semibold">
              {employee.averageRating !== null
                ? employee.averageRating.toFixed(1).replace(".", ",")
                : "Novo"}
            </p>
          </div>

          {/* Name + rating count overlaid on the photo */}
          <div className="absolute inset-x-0 bottom-0 space-y-2 p-3 pb-4 md:p-4">
            <div>
              <h3 className="truncate text-sm font-bold text-white md:text-base">
                {employee.name}
              </h3>
              <p className="truncate text-xs text-white/70">
                {employee.ratingCount > 0
                  ? `${employee.ratingCount} avaliações`
                  : "Ainda sem avaliações"}
              </p>
            </div>

            <Button
              className="w-full cursor-pointer border-0 py-2.5 text-sm shadow-none md:py-3 md:text-base"
              nativeButton={false}
              render={(buttonProps) => (
                <Link href={`/employees/${employee.id}`} {...buttonProps}>
                  Visualizar
                </Link>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default EmployeeItem
