import { SearchIcon } from "lucide-react"
import Header from "./components/header"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import Image from "next/image"
import { Card, CardContent } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { Avatar, AvatarImage } from "./components/ui/avatar"
import { prisma } from "./_lib/prisma"
import BarbershopItem from "./components/barbershop-item"
import Footer from "./components/footer"

export default async function Home() {
  const barbershops = await prisma.barbershop.findMany({})
  const popularBarbershops = await prisma.barbershop.findMany({
    orderBy: {
      name: "desc",
    },
  })

  return (
    <div>
      {/* Header */}
      <Header></Header>

      <div className="p-4">
        {/* Text */}
        <h2 className="text-xl font-bold">Olá, Gabriel!</h2>

        <p>Segunda-feira, 20 de julho.</p>

        {/* Search */}
        <div className="mt-6 flex items-center gap-2">
          <Input placeholder="Faça sua busca..." className="px-3 py-5"></Input>
          <Button className="px-4 py-5">
            <SearchIcon></SearchIcon>
          </Button>
        </div>

        {/* Fast Search */}
        <div className="mt-6 flex items-center justify-between gap-2.5 overflow-x-scroll [&::-webkit-scrollbar]:hidden">
          <Button variant="outline" className="gap-2 px-2 py-4">
            <Image src="/cabelo.svg" alt="Corte" width={16} height={16} />
            Corte
          </Button>
          <Button variant="outline" className="gap-2 px-2 py-4">
            <Image src="/barba.svg" alt="Barba" width={16} height={16} />
            Barba
          </Button>
          <Button variant="outline" className="gap-2 px-2 py-4">
            <Image
              src="/acabamento.svg"
              alt="Acabamento"
              width={16}
              height={16}
            />
            Acabamento
          </Button>
          <Button variant="outline" className="gap-2 px-2 py-4">
            <Image
              src="/acabamento.svg"
              alt="Acabamento"
              width={16}
              height={16}
            />
            Sobrancelha
          </Button>
          <Button variant="outline" className="gap-2 px-2 py-4">
            <Image
              src="/acabamento.svg"
              alt="Acabamento"
              width={16}
              height={16}
            />
            Pezinho
          </Button>
          <Button variant="outline" className="gap-2 px-2 py-4">
            <Image
              src="/acabamento.svg"
              alt="Acabamento"
              width={16}
              height={16}
            />
            Acabamento
          </Button>
        </div>

        {/* Banner */}
        <div className="relative mt-4 h-37.5 w-full">
          <Image
            src="/banner-01.png"
            alt="Banner 01"
            fill
            className="object-contain"
          />
        </div>

        {/* Schedule */}
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

        {/* Barbershops */}
        <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase">
          Recomendados
        </h2>
        <div className="mt-2 flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden">
          {barbershops.map((barbershop) => (
            <BarbershopItem
              key={barbershop.id}
              barbershop={barbershop}
            ></BarbershopItem>
          ))}
        </div>

        <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase">
          Populares
        </h2>
        <div className="mt-2 flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden">
          {popularBarbershops.map((barbershop) => (
            <BarbershopItem
              key={barbershop.id}
              barbershop={barbershop}
            ></BarbershopItem>
          ))}
        </div>
      </div>
      <Footer></Footer>
    </div>
  )
}
