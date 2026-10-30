"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { CalendarIcon, HomeIcon, LogOutIcon } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"

interface AtendenteHeaderProps {
  atendenteName: string
  slug: string
}

const getNavItems = (atendentePath: string) => [
  { href: atendentePath, label: "Início", icon: HomeIcon },
  {
    href: `${atendentePath}/bookings`,
    label: "Agendamentos",
    icon: CalendarIcon,
  },
]

const AtendenteHeader = ({ atendenteName, slug }: AtendenteHeaderProps) => {
  const pathname = usePathname()
  const atendentePath = `/b/${slug}/atendente`
  const navItems = getNavItems(atendentePath)

  const handleLogoutClick = () => {
    sessionStorage.setItem("pending-auth-toast", "logout")
    signOut({ callbackUrl: "/admin/login" })
  }

  return (
    <Card className="bg-background rounded-none">
      <CardContent className="flex items-center justify-between gap-2 md:px-6 md:py-2 lg:px-10 xl:px-32">
        <Link href={atendentePath} className="shrink-0">
          <Image
            src="/logo.png"
            alt="Vig Barber"
            width={120}
            height={29}
            className="md:h-auto md:w-28 xl:w-36"
          />
        </Link>

        <nav className="flex min-w-0 items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const isActive =
              item.href === atendentePath
                ? pathname === atendentePath
                : pathname.startsWith(item.href)

            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                size="icon"
                className="cursor-pointer gap-3 xl:size-auto xl:px-4 xl:py-2"
                nativeButton={false}
                render={(buttonProps) => (
                  <Link href={item.href} title={item.label} {...buttonProps}>
                    <item.icon size={16} />
                    <span className="hidden xl:inline">{item.label}</span>
                  </Link>
                )}
              />
            )
          })}
        </nav>

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
