"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  BriefcaseIcon,
  CalendarIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  ScissorsIcon,
  UsersIcon,
} from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import Image from "next/image"

interface AdminHeaderProps {
  adminName: string
}

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/bookings", label: "Agendamentos", icon: CalendarIcon },
  { href: "/admin/services", label: "Serviços", icon: BriefcaseIcon },
  { href: "/admin/employees", label: "Funcionários", icon: UsersIcon },
]

const AdminHeader = ({ adminName }: AdminHeaderProps) => {
  const pathname = usePathname()

  const handleLogoutClick = () => {
    sessionStorage.setItem("pending-auth-toast", "logout")
    signOut({ callbackUrl: "/admin/login" })
  }

  return (
    <Card className="bg-background rounded-none">
      <CardContent className="flex items-center justify-between md:px-8 md:py-2 lg:px-16 xl:px-32">
        <Link href="/admin">
          <Image
            src="/logo.png"
            alt="Vig Barber"
            width={120}
            height={120}
            className="md:h-auto md:w-36"
          />
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href)

            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                className="cursor-pointer gap-3"
                nativeButton={false}
                render={(buttonProps) => (
                  <Link href={item.href} {...buttonProps}>
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                )}
              />
            )
          })}
        </nav>

        <div className="flex items-center gap-6">
          <span className="text-muted-foreground hidden text-sm md:inline">
            {adminName}
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

      <nav className="flex items-center gap-1 overflow-x-auto border-t p-2 md:hidden [&::-webkit-scrollbar]:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)

          return (
            <Button
              key={item.href}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className="shrink-0 cursor-pointer gap-1.5"
              nativeButton={false}
              render={(buttonProps) => (
                <Link href={item.href} {...buttonProps}>
                  <item.icon size={14} />
                  {item.label}
                </Link>
              )}
            />
          )
        })}
      </nav>
    </Card>
  )
}

export default AdminHeader
