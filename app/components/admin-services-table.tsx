"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
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
import ServiceFormDialog from "./service-form-dialog"
import { deleteService } from "../_actions/delete-service"

interface AdminService {
  id: string
  name: string
  description: string
  price: number
  durationInMinutes: number
  imageUrl: string
}

interface AdminServicesTableProps {
  services: AdminService[]
}

const AdminServicesTable = ({ services }: AdminServicesTableProps) => {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpenId, setDeleteDialogOpenId] = useState<string | null>(
    null,
  )

  const handleDelete = async (serviceId: string) => {
    setIsDeleting(true)

    try {
      await deleteService(serviceId)
      toast.success("Serviço removido com sucesso!")
      setDeleteDialogOpenId(null)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao remover serviço.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ServiceFormDialog
          mode="create"
          renderTrigger={(triggerProps) => (
            <Button className="cursor-pointer gap-2" {...triggerProps}>
              <PlusIcon size={18} />
              Novo serviço
            </Button>
          )}
        />
      </div>

      {services.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Nenhum serviço cadastrado.
        </p>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={service.imageUrl}
                      alt={service.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{service.name}</p>
                    <p className="text-muted-foreground line-clamp-1 text-xs">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:gap-6">
                  <div className="text-right">
                    <p className="text-primary text-sm font-bold">
                      {Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(service.price)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {service.durationInMinutes} min
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <ServiceFormDialog
                      mode="edit"
                      serviceId={service.id}
                      defaultValues={{
                        name: service.name,
                        description: service.description,
                        price: service.price,
                        durationInMinutes: service.durationInMinutes,
                        imageUrl: service.imageUrl,
                      }}
                      renderTrigger={(triggerProps) => (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="cursor-pointer"
                          {...triggerProps}
                        >
                          <PencilIcon size={16} />
                        </Button>
                      )}
                    />

                    <AlertDialog
                      open={deleteDialogOpenId === service.id}
                      onOpenChange={(isOpen) =>
                        setDeleteDialogOpenId(isOpen ? service.id : null)
                      }
                    >
                      <AlertDialogTrigger
                        render={(triggerProps) => (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive cursor-pointer"
                            {...triggerProps}
                          >
                            <Trash2Icon size={16} />
                          </Button>
                        )}
                      />
                      <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover serviço</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover &quot;{service.name}
                            &quot;? Essa ação não pode ser desfeita.
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
                              handleDelete(service.id)
                            }}
                          >
                            {isDeleting ? "Removendo..." : "Confirmar"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminServicesTable
