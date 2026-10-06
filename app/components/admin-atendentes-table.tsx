"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2Icon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog"
import CreateAtendenteDialog from "./create-atendente-dialog"
import { deleteAtendente } from "../_actions/delete-atendente"

const getInitials = (name?: string | null) => {
  if (!name) return "?"

  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.charAt(0) ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ""

  return (first + last).toUpperCase()
}

interface AdminAtendente {
  id: string
  name: string | null
  email: string | null
  image: string | null
  phone: string | null
}

interface AdminAtendentesTableProps {
  atendentes: AdminAtendente[]
  totalCount: number
}

const AdminAtendentesTable = ({
  atendentes,
  totalCount,
}: AdminAtendentesTableProps) => {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpenId, setDeleteDialogOpenId] = useState<string | null>(
    null,
  )

  const handleDelete = async (userId: string) => {
    setIsDeleting(true)

    try {
      await deleteAtendente(userId)
      toast.success("Atendente removido com sucesso!")
      setDeleteDialogOpenId(null)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao remover atendente.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          Atendentes
          <Badge variant="secondary">{totalCount}</Badge>
        </h2>
        <CreateAtendenteDialog />
      </div>

      {atendentes.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Nenhum atendente cadastrado.
        </p>
      ) : (
        <div className="space-y-3">
          {atendentes.map((atendente) => {
            const name = atendente.name ?? "Atendente"

            return (
              <Card
                key={atendente.id}
                className="hover:bg-muted/40 transition-colors"
              >
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-11">
                      <AvatarImage
                        src={atendente.image ?? ""}
                        alt={name}
                        referrerPolicy="no-referrer"
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{name}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {atendente.email}
                      </p>
                      {atendente.phone && (
                        <p className="text-muted-foreground truncate text-xs">
                          {atendente.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <AlertDialog
                    open={deleteDialogOpenId === atendente.id}
                    onOpenChange={(isOpen) =>
                      setDeleteDialogOpenId(isOpen ? atendente.id : null)
                    }
                  >
                    <AlertDialogTrigger
                      render={(triggerProps) => (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive shrink-0 cursor-pointer"
                          {...triggerProps}
                        >
                          <Trash2Icon size={16} />
                        </Button>
                      )}
                    />
                    <AlertDialogContent size="default">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover atendente</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover &quot;{name}&quot;?
                          Essa ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          disabled={isDeleting}
                          onClick={(e) => {
                            e.preventDefault()
                            handleDelete(atendente.id)
                          }}
                        >
                          {isDeleting ? "Removendo..." : "Confirmar"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AdminAtendentesTable
