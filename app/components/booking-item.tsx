import { Card, CardContent } from "./ui/card"
import { Avatar, AvatarImage } from "./ui/avatar"
import { Badge } from "./ui/badge"

// TODO recive schedule as props

const BookingItem = () => {
  return (
    <>
      <h2 className="mt-5 text-xs font-bold text-gray-400 uppercase">
        Agendamentos
      </h2>
      <Card className="mt-2 p-0">
        <CardContent className="flex items-stretch justify-between p-0">
          {/* Left */}
          <div className="flex flex-col gap-2 p-4">
            <Badge className="w-fit">Confirmado</Badge>
            <h3 className="font-semibold">Corte de Cabelo</h3>

            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src="https://utfs.io/f/c97a2dc9-cf62-468b-a851-bfd2bdde775f-16p.png"></AvatarImage>
              </Avatar>
              <p className="text-sm">Vig Barber</p>
            </div>
          </div>

          {/* Right */}
          <div className="border-border flex flex-col items-center justify-center border-l px-5">
            <p className="text-sm">Julho</p>
            <p className="text-2xl font-bold">20</p>
            <p className="font-semibold">14:00</p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default BookingItem
