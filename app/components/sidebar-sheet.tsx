"use client"

import { Button } from "./ui/button"
import {
  CalendarIcon,
  HomeIcon,
  LogInIcon,
  LogOutIcon,
  UserIcon,
  UserPlusIcon,
} from "lucide-react"
import { SheetClose, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet"
import { quickSearchOptions } from "../_constants/search"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import Link from "next/link"
import Image from "next/image"
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog"
import { signOut, useSession } from "next-auth/react"
import SignInDialog from "./sign-in-dialog"

const getInitials = (name?: string | null) => {
  if (!name) return "?"

  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.charAt(0) ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ""

  return (first + last).toUpperCase()
}

const SidebarSheet = () => {
  const { data } = useSession()

  const handleLogoutClick = () => signOut()

  const initials = getInitials(data?.user?.name)

  return (
    <SheetContent className="overflow-y-auto p-0">
      <SheetHeader className="pb-3">
        <SheetTitle>Menu</SheetTitle>
      </SheetHeader>

      <div className="border-b px-4 pt-0 pb-5">
        {data?.user ? (
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage
                src={data?.user.image ?? ""}
                alt="User"
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div>
              <p className="font-bold">{data.user.name}</p>
              <div className="text-xs">{data.user.email}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex size-11 shrink-0 items-center justify-center rounded-full">
              <UserIcon size={22} className="text-primary" />
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <h2 className="font-bold">Olá, bem-vindo!</h2>
                <p className="text-muted-foreground text-xs">
                  Faça login ou crie uma conta
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Dialog>
                  <DialogTrigger
                    render={(triggerProps) => (
                      <Button
                        size="sm"
                        className="cursor-pointer gap-1.5"
                        {...triggerProps}
                      >
                        <LogInIcon size={16} />
                        Entrar
                      </Button>
                    )}
                  />
                  <DialogContent className="w-[90%] text-center">
                    <SignInDialog initialMode="login"></SignInDialog>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger
                    render={(triggerProps) => (
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer gap-1.5"
                        {...triggerProps}
                      >
                        <UserPlusIcon size={16} />
                        Criar Conta
                      </Button>
                    )}
                  />
                  <DialogContent className="w-[90%] text-center">
                    <SignInDialog initialMode="signup"></SignInDialog>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-b p-4 pt-2">
        <SheetClose
          nativeButton={false}
          render={(closeProps) => (
            <Button
              className="justify-start gap-2 py-4"
              nativeButton={false}
              {...closeProps}
              render={(buttonProps) => (
                <Link href="/" {...buttonProps}>
                  <HomeIcon size={18} />
                  Início
                </Link>
              )}
            />
          )}
        />
        <SheetClose
          nativeButton={false}
          render={(closeProps) => (
            <Button
              className="justify-start gap-2 py-4"
              variant="ghost"
              nativeButton={false}
              {...closeProps}
              render={(buttonProps) => (
                <Link href="/bookings" {...buttonProps}>
                  <CalendarIcon size={18} />
                  Agendamentos
                </Link>
              )}
            />
          )}
        />
      </div>

      <div className="flex flex-col gap-3 border-b p-4 pt-1">
        {quickSearchOptions.map((option) => (
          <Button
            className="justify-start gap-2 py-4"
            variant="ghost"
            key={option.title}
            nativeButton={false}
            render={(buttonProps) => (
              <Link
                href={`/barbershops?search=${option.title}`}
                {...buttonProps}
              >
                <Image
                  src={option.imageUrl}
                  alt={option.title}
                  width={18}
                  height={18}
                />
                {option.title}
              </Link>
            )}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 p-4 pt-1">
        {data?.user && (
          <Button
            className="cursor-pointer justify-start gap-2 py-4 text-red-400"
            variant="ghost"
            onClick={handleLogoutClick}
          >
            <LogOutIcon size={18} className="text-red-400"></LogOutIcon>
            Sair da Conta
          </Button>
        )}
      </div>
    </SheetContent>
  )
}

export default SidebarSheet
