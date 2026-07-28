"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet"
import { Calendar } from "./ui/calendar"
import { ptBR } from "date-fns/locale"
import { BarbershopService } from "@prisma/client"

interface ServiceItemProps {
  service: Omit<BarbershopService, "price"> & { price: number }
}

const ServiceItem = ({ service }: ServiceItemProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined)

  return (
    <Card className="p-0">
      <CardContent className="flex items-center gap-2 p-3">
        <div className="relative max-h-27.5 min-h-27.5 max-w-27.5 min-w-27.5 overflow-hidden rounded-lg">
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">{service.name}</h3>
          <p className="text-sm text-gray-400">{service.description}</p>
          <div className="flex items-center justify-between">
            <p className="text-primary text-sm font-bold">
              {Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(service.price)}
            </p>

            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="secondary" size="sm">
                    Reservar
                  </Button>
                }
              ></SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Fazer Reserva</SheetTitle>
                </SheetHeader>

                <div className="py-4">
                  <Calendar
                    mode="single"
                    locale={ptBR}
                    selected={date}
                    onSelect={setDate}
                    className="rounded-lg border"
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ServiceItem
