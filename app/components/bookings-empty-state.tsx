"use client"

import { CalendarX2Icon, LogInIcon, UserPlusIcon } from "lucide-react"
import { Button } from "../components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "../components/ui/dialog"
import SignInDialog from "../components/sign-in-dialog"

const BookingsEmptyState = () => {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center lg:gap-6 lg:py-24">
      <div className="bg-primary/10 flex size-16 items-center justify-center rounded-full lg:size-20">
        <CalendarX2Icon size={30} className="text-primary lg:size-9" />
      </div>

      <div className="space-y-1 lg:space-y-2">
        <h2 className="text-lg font-bold lg:text-2xl">
          Você ainda não tem agendamentos
        </h2>
        <p className="text-muted-foreground text-sm lg:text-base">
          Faça login ou crie uma conta para ver seus agendamentos.
        </p>
      </div>

      <div className="flex gap-2 lg:gap-3">
        <Dialog>
          <DialogTrigger
            render={(triggerProps) => (
              <Button
                className="cursor-pointer gap-2 lg:px-6 lg:py-5 lg:text-base"
                {...triggerProps}
              >
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
                className="cursor-pointer gap-2 lg:px-6 lg:py-5 lg:text-base"
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
  )
}

export default BookingsEmptyState
