"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { Loader2Icon, LogInIcon, UserPlusIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog"
import SignInDialog from "./sign-in-dialog"
import { acceptInvitation } from "../_actions/accept-invitation"

type InvitationActionsProps =
  | { mode: "signed-out"; loginHref: string }
  | { mode: "wrong-account"; loginHref: string }
  | { mode: "accept"; token: string }

// The buttons under an invitation: sign in / create an account, switch
// accounts, or accept
const InvitationActions = (props: InvitationActionsProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (props.mode === "signed-out") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          className="cursor-pointer"
          nativeButton={false}
          render={<Link href={props.loginHref} />}
        >
          <LogInIcon className="size-4" />
          Entrar
        </Button>

        <Dialog>
          <DialogTrigger
            render={(triggerProps) => (
              <Button
                variant="outline"
                className="cursor-pointer"
                {...triggerProps}
              >
                <UserPlusIcon className="size-4" />
                Criar conta
              </Button>
            )}
          />
          <DialogContent className="w-[90%] text-center">
            <SignInDialog initialMode="signup" />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (props.mode === "wrong-account") {
    const { loginHref } = props

    return (
      <Button
        variant="outline"
        className="cursor-pointer"
        onClick={() => signOut({ callbackUrl: loginHref })}
      >
        Sair e entrar com outra conta
      </Button>
    )
  }

  const handleAccept = async () => {
    setIsSubmitting(true)

    try {
      const { path, alreadyMember } = await acceptInvitation(props.token)
      toast.success(
        alreadyMember
          ? "Você já faz parte desta equipe."
          : "Convite aceito! Bem-vindo à equipe.",
      )
      router.push(path)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao aceitar o convite.",
      )
      setIsSubmitting(false)
    }
  }

  return (
    <Button
      className="w-full cursor-pointer py-5 sm:w-auto sm:px-8"
      onClick={handleAccept}
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        "Aceitar convite"
      )}
    </Button>
  )
}

export default InvitationActions
