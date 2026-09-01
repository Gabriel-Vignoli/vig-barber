"use client"

import { Button } from "./ui/button"
import { LogInIcon, LogOutIcon, UserIcon, UserPlusIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
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

const DesktopProfileMenu = () => {
  const { data } = useSession()

  const handleLogoutClick = () => signOut()

  const initials = getInitials(data?.user?.name)

  return (
    <Popover>
      <PopoverTrigger
        render={(triggerProps) => (
          <Button
            className="cursor-pointer gap-2 rounded-full"
            variant={data?.user ? "link" : "default"}
            {...triggerProps}
          >
            {data?.user ? (
              <>
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={data.user.image ?? ""}
                    alt={data.user.name ?? "User"}
                    referrerPolicy="no-referrer"
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hover:underline-primary font-bold text-white hover:text-white">
                  {data.user.name}
                </span>
              </>
            ) : (
              <>
                <UserIcon size={18} />
                Perfil
              </>
            )}
          </Button>
        )}
      />

      <PopoverContent className="w-64 p-4">
        {data?.user ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage
                  src={data.user.image ?? ""}
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

            <Button
              className="cursor-pointer justify-start gap-2 text-red-400"
              variant="ghost"
              onClick={handleLogoutClick}
            >
              <LogOutIcon size={18} className="text-red-400" />
              Sair da Conta
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <div className="bg-primary/10 flex size-14 items-center justify-center rounded-full">
              <UserIcon size={26} className="text-primary" />
            </div>

            <div className="space-y-1">
              <h2 className="font-bold">Olá, bem-vindo!</h2>
              <p className="text-muted-foreground text-sm">
                Faça login ou crie uma conta para agendar.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2">
              <Dialog>
                <DialogTrigger
                  render={(triggerProps) => (
                    <Button className="cursor-pointer gap-2" {...triggerProps}>
                      <LogInIcon size={18} />
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
                      variant="outline"
                      className="cursor-pointer gap-2"
                      {...triggerProps}
                    >
                      <UserPlusIcon size={18} />
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
        )}
      </PopoverContent>
    </Popover>
  )
}

export default DesktopProfileMenu
