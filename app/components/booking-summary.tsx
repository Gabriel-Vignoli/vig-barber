import { Barbershop, BarbershopService } from "@prisma/client"
import { Card, CardContent } from "./ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface BookingSummaryProps {
  service: Pick<
    Omit<BarbershopService, "price"> & { price: number },
    "name" | "price"
  >
  barbershop: Pick<Barbershop, "name">
  selectedDay: Date
}

const BookingSummary = ({
  service,
  barbershop,
  selectedDay,
}: BookingSummaryProps) => {
  return (
    <Card>
      <CardContent className="space-y-3 px-3 lg:px-4 lg:py-1">
        <div className="flex items-center justify-between">
          <h2 className="font-bold md:text-base">{service.name}</h2>
          <p className="text-sm font-bold md:text-base">
            {Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(Number(service.price))}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-gray-400 md:text-base">Data</h2>
          <p className="text-sm md:text-base">
            {format(selectedDay, "d 'de' MMMM", {
              locale: ptBR,
            })}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-gray-400 md:text-base">Horário</h2>
          <p className="text-sm md:text-base">{format(selectedDay, "HH:mm")}</p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-gray-400 md:text-base">Barbearia</h2>
          <p className="text-sm md:text-base">{barbershop.name}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default BookingSummary
