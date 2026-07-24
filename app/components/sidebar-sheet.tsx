"use client"

import { Button } from "./ui/button"
import { CalendarIcon, HomeIcon, LogInIcon, LogOutIcon } from "lucide-react"
import { SheetContent, SheetHeader, SheetTitle } from "./ui/sheet"
import { quickSearchOptions } from "../_constants/search"
import { Avatar, AvatarImage } from "./ui/avatar"
import Link from "next/link"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { signIn, signOut, useSession } from "next-auth/react"

const SidebarSheet = () => {
  const { data } = useSession()

  const handleLoginWithGoogleClick = () => signIn("google")
  const handleLogoutClick = () => signOut()

  return (
    <SheetContent className="overflow-y-auto p-0">
      <SheetHeader className="pb-3">
        <SheetTitle>Menu</SheetTitle>
      </SheetHeader>

      <div className="flex items-center gap-3 border-b px-4 pt-0 pb-5">
        {data?.user ? (
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage
                src={data?.user.image ?? ""}
                alt="User"
                referrerPolicy="no-referrer"
              />
            </Avatar>

            <div>
              <p className="font-bold">{data.user.name}</p>
              <div className="text-xs">{data.user.email}</div>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold">Olá, faça seu login!</h2>
            <Dialog>
              <DialogTrigger
                render={
                  <Button size="icon">
                    <LogInIcon></LogInIcon>
                  </Button>
                }
              ></DialogTrigger>
              <DialogContent className="w-[90%] text-center">
                <DialogHeader>
                  <DialogTitle>Faça login na plataforma</DialogTitle>
                  <DialogDescription>
                    Conecte-se usando sua conta do Google
                  </DialogDescription>
                </DialogHeader>

                <Button
                  variant="outline"
                  className="gap-2 p-4 font-bold"
                  onClick={handleLoginWithGoogleClick}
                >
                  <Image
                    src="/google.svg"
                    alt="Google Icon"
                    width={18}
                    height={18}
                  ></Image>
                  Google
                </Button>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 border-b p-4 pt-2">
        <Button
          className="justify-start gap-2 py-4"
          render={<Link href="/" />}
          nativeButton={false}
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
        <Button
          className="justify-start gap-2 py-4 text-red-400"
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

export default SidebarSheet
