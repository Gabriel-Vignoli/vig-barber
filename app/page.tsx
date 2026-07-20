import { SearchIcon } from "lucide-react"
import Header from "./components/header"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import Image from "next/image"
import { Card, CardContent } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { Avatar, AvatarImage } from "./components/ui/avatar"

export default function Home() {
  return (
    <div>
      {/* Header */}
      <Header></Header>

      {/* Text */}
      <div className="p-5">
        <h2 className="text-xl font-bold">Olá, Gabriel!</h2>

        <p>Segunda-feira, 20 de julho.</p>

        {/* Search */}
        <div className="mt-6 flex items-center gap-2">
          <Input placeholder="Faça sua busca..." className="px-3 py-4"></Input>
          <Button>
            <SearchIcon></SearchIcon>
          </Button>
        </div>

        {/* Banner */}
        <div className="relative mt-6 h-37.5 w-full">
          <Image
            src="/banner-01.png"
            alt="Banner 01"
            fill
            className="object-contain"
          />
        </div>

        {/* Schedule */}
        <Card className="mt-6 p-0">
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
      </div>
    </div>
  )
}
