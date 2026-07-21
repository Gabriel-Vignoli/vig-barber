import Image from "next/image"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { MenuIcon } from "lucide-react"

const Header = () => {
  return (
    <Card className="bg-background rounded-none">
      <CardContent className="flex items-center justify-between px-4">
        <Image src="/logo.png" alt="Vig Barber" width={120} height={120} />
        <Button size="icon" variant="ghost">
          <MenuIcon></MenuIcon>
        </Button>
      </CardContent>
    </Card>
  )
}

export default Header
