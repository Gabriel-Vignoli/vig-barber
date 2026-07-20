import { SearchIcon } from "lucide-react"
import Header from "./components/header"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import Image from "next/image"

export default function Home() {
  return (
    <div>
      <Header></Header>
      <div className="p-5">
        <h2 className="text-xl font-bold">Olá, Gabriel!</h2>

        <p>Segunda-feira, 20 de julho.</p>

        <div className="mt-6 flex items-center gap-2">
          <Input placeholder="Faça sua busca..." className="px-3 py-4"></Input>
          <Button>
            <SearchIcon></SearchIcon>
          </Button>
        </div>

        <div className="relative mt-2 h-37.5 w-full">
          <Image
            src="/banner-01.png"
            alt="Banner 01"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </div>
  )
}
