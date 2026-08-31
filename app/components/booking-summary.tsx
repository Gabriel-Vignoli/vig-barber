import { BarbershopService } from "@prisma/client"
import { Card, CardContent } from "./ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface BookingSummaryProps {
  service: Pick<
    Omit<BarbershopService, "price"> & { price: number },
    "name" | "price"
  >
  selectedDay: Date
  employee: {
    name: string
  }
}

const BookingSummary = ({
  service,
  selectedDay,
  employee,
}: BookingSummaryProps) => {
  return (
    <Card>
      <CardContent className="space-y-3 px-3 lg:px-4 lg:py-1">
        <div className="flex items-center justify-between">
          <h2 className="font-bold md:text-base">{service.name}</h2>
          <p className="text-primary text-sm font-bold md:text-base">
            {Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(Number(service.price))}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-gray-400 md:text-base">Profissional</h2>
          <p className="truncate text-sm font-semibold md:text-base">
            {employee.name.split(" ")[0]}
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
      </CardContent>
    </Card>
  )
}

export default BookingSummary
