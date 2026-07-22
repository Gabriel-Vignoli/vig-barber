import Image from "next/image"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { CalendarIcon, HomeIcon, LogOutIcon, MenuIcon } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet"
import { quickSearchOptions } from "../_constants/search"
import { Avatar, AvatarImage } from "./ui/avatar"
import Link from "next/link"

const Header = () => {
  return (
    <Card className="bg-background rounded-none">
      <CardContent className="flex items-center justify-between">
        <Image src="/logo.png" alt="Vig Barber" width={120} height={120} />

        <Sheet>
          <SheetTrigger
            render={
              <Button size="icon" variant="ghost">
                <MenuIcon />
              </Button>
            }
          />
          <SheetContent className="overflow-y-auto p-0">
            <SheetHeader className="pb-3">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>

            <div className="flex items-center gap-3 border-b px-4 pt-0 pb-5">
              <Avatar>
                <AvatarImage src="/banner.jpg" alt="User" />
              </Avatar>

              <div>
                <p className="font-bold">Gabriel Vignoli</p>
                <div className="text-xs">gabriel.vignoli@example.com</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-b p-4 pt-2">
              <Button
                className="justify-start gap-2 py-4"
                render={<Link href="/" />}
              >
                <HomeIcon size={18} />
                Início
              </Button>
              <Button className="justify-start gap-2 py-4" variant="ghost">
                <CalendarIcon size={18}></CalendarIcon>Agendamentos
              </Button>
            </div>

            <div className="flex flex-col gap-3 border-b p-4 pt-1">
              {quickSearchOptions.map((option) => (
                <Button
                  className="justify-start gap-2 py-4"
                  variant="ghost"
                  key={option.title}
                >
                  <Image
                    src={option.imageUrl}
                    alt={option.title}
                    width={18}
                    height={18}
                  />
                  {option.title}
                </Button>
              ))}
            </div>

            <div className="flex flex-col gap-3 p-4 pt-1">
              <Button className="justify-start gap-2 py-4" variant="ghost">
                <LogOutIcon size={18}></LogOutIcon>
                Sair da Conta
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  )
}

export default Header
