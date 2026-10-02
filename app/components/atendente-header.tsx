"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { LogOutIcon } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import Image from "next/image"

interface AtendenteHeaderProps {
  atendenteName: string
}

const AtendenteHeader = ({ atendenteName }: AtendenteHeaderProps) => {
  const handleLogoutClick = () => {
    sessionStorage.setItem("pending-auth-toast", "logout")
    signOut({ callbackUrl: "/admin/login" })
  }

  return (
    <Card className="bg-background rounded-none">
      <CardContent className="flex items-center justify-between gap-2 md:px-6 md:py-2 lg:px-10 xl:px-32">
        <Link href="/admin/atendente" className="shrink-0">
          <Image
            src="/logo.png"
            alt="Vig Barber"
            width={120}
            height={120}
            className="md:h-auto md:w-28 xl:w-36"
          />
        </Link>

        <div className="flex shrink-0 items-center gap-2 md:gap-4 xl:gap-6">
          <span className="text-muted-foreground hidden text-sm md:inline">
            {atendenteName}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer text-red-400"
            onClick={handleLogoutClick}
          >
            <LogOutIcon size={18} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default AtendenteHeader
