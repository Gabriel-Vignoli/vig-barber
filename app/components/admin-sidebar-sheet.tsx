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
import { SheetClose, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet"
import { Button } from "./ui/button"

interface AdminSidebarSheetProps {
  adminName: string
}

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/bookings", label: "Agendamentos", icon: CalendarIcon },
  { href: "/admin/services", label: "Serviços", icon: BriefcaseIcon },
  { href: "/admin/employees", label: "Funcionários", icon: UsersIcon },
]

const AdminSidebarSheet = ({ adminName }: AdminSidebarSheetProps) => {
  const pathname = usePathname()

  const handleLogoutClick = () => {
    sessionStorage.setItem("pending-auth-toast", "logout")
    signOut({ callbackUrl: "/admin/login" })
  }

  return (
    <SheetContent className="overflow-y-auto p-0">
      <SheetHeader className="pb-3">
        <SheetTitle>Menu Admin</SheetTitle>
      </SheetHeader>

      <div className="flex items-center gap-2 border-b px-4 pt-0 pb-5">
        <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
          <ScissorsIcon size={18} className="text-primary" />
        </div>
        <div>
          <p className="font-bold">{adminName}</p>
          <p className="text-muted-foreground text-xs">Administrador</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b p-4 pt-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)

          return (
            <SheetClose
              key={item.href}
              nativeButton={false}
              render={(closeProps) => (
                <Button
                  className="justify-start gap-2 py-4"
                  variant={isActive ? "default" : "ghost"}
                  nativeButton={false}
                  {...closeProps}
                  render={(buttonProps) => (
                    <Link href={item.href} {...buttonProps}>
                      <item.icon size={18} />
                      {item.label}
                    </Link>
                  )}
                />
              )}
            />
          )
        })}
      </div>

      <div className="flex flex-col gap-3 p-4 pt-1">
        <Button
          className="cursor-pointer justify-start gap-2 py-4 text-red-400"
          variant="ghost"
          onClick={handleLogoutClick}
        >
          <LogOutIcon size={18} className="text-red-400"></LogOutIcon>
          Sair da Conta
        </Button>
      </div>
    </SheetContent>
  )
}

export default AdminSidebarSheet
