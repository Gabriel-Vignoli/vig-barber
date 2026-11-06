"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { DownloadIcon, Loader2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog"
import { deleteAccount } from "../_actions/delete-account"
import { getMyData } from "../_actions/get-my-data"
import { unwrap } from "../_lib/action-result"

const ProfileDataActions = ({ email }: { email: string }) => {
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState("")

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const data = await getMyData()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "vig-barber-meus-dados.json"
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Não foi possível baixar seus dados. Tente novamente.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await unwrap(deleteAccount(confirmEmail))
      sessionStorage.setItem("pending-auth-toast", "accountDeleted")
      // isDeleting stays true until the browser leaves this page
      await signOut({ callbackUrl: "/" })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir a conta.",
      )
      setIsDeleting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) setConfirmEmail("")
  }

  const canDelete =
    !isDeleting &&
    confirmEmail.trim().toLowerCase() === email.trim().toLowerCase()

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">
          Baixe uma cópia do seu perfil, agendamentos, avaliações e aceites em
          formato JSON.
        </p>
        <Button
          variant="outline"
          className="cursor-pointer gap-2"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2Icon size={16} className="animate-spin" />
          ) : (
            <DownloadIcon size={16} />
          )}
          Baixar meus dados
        </Button>
      </div>

      <div className="space-y-2 border-t pt-4">
        <p className="text-muted-foreground text-sm">
          Excluir a conta apaga seus dados pessoais e cancela seus agendamentos
          futuros. Isso não pode ser desfeito.
        </p>

        <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger
            render={
              <Button variant="destructive" className="cursor-pointer">
                Excluir minha conta
              </Button>
            }
          />
          <AlertDialogContent className="lg:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Seu nome, email, telefone e foto serão apagados e seus
                agendamentos futuros, cancelados. O histórico das barbearias e
                suas avaliações continuam, como de um usuário anônimo. Isso não
                pode ser desfeito.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-1.5">
              <Label htmlFor="delete-account-email">
                Digite {email} para confirmar
              </Label>
              <Input
                id="delete-account-email"
                type="email"
                autoComplete="off"
                value={confirmEmail}
                onChange={(event) => setConfirmEmail(event.target.value)}
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel
                className="cursor-pointer"
                disabled={isDeleting}
              >
                Voltar
              </AlertDialogCancel>
              <Button
                variant="destructive"
                className="cursor-pointer"
                onClick={handleDelete}
                disabled={!canDelete}
              >
                {isDeleting ? (
                  <Loader2Icon size={16} className="animate-spin" />
                ) : (
                  "Excluir conta"
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default ProfileDataActions
