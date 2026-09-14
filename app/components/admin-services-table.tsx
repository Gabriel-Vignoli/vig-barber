"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { ClockIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
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
        <p className="text-muted-foreground py-8 text-center text-sm xl:text-base">
          Nenhum serviço cadastrado.
        </p>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <Card
              key={service.id}
              className="hover:bg-muted/40 transition-colors"
            >
              <CardContent className="flex flex-col gap-4 p-3 sm:flex-row sm:items-center lg:p-4">
                <div className="flex flex-1 items-center gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl lg:size-20">
                    <Image
                      src={service.imageUrl}
                      alt={service.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-semibold lg:text-lg">
                      {service.name}
                    </p>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {service.description}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-muted-foreground gap-1 font-normal"
                    >
                      <ClockIcon size={12} />
                      {service.durationInMinutes} min
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                  <p className="text-primary text-lg font-bold lg:text-xl">
                    {Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(service.price)}
                  </p>

                  <div className="flex gap-1">
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
