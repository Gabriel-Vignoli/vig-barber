import Image from "next/image"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { MenuIcon } from "lucide-react"
import { Sheet, SheetTrigger } from "./ui/sheet"
import SidebarSheet from "./sidebar-sheet"
import Link from "next/link"

const Header = () => {
  return (
    <Card className="bg-background rounded-none">
      <CardContent className="flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.png" alt="Vig Barber" width={120} height={120} />
        </Link>

        <Sheet>
          <SheetTrigger
            render={
              <Button size="icon" variant="ghost" className="cursor-pointer">
                <MenuIcon />
              </Button>
            }
          />
          <SidebarSheet></SidebarSheet>
        </Sheet>
      </CardContent>
    </Card>
  )
}

export default Header
