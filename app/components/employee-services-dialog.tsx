"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BriefcaseIcon, Loader2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Label } from "./ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { updateEmployeeServices } from "../_actions/update-employee-services"

interface EmployeeServicesDialogProps {
  employeeId: string
  allServices: { id: string; name: string }[]
  currentServiceIds: string[]
}

const EmployeeServicesDialog = ({
  employeeId,
  allServices,
  currentServiceIds,
}: EmployeeServicesDialogProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>(currentServiceIds)

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) setSelectedIds(currentServiceIds)
  }

  const toggleService = (serviceId: string) => {
    setSelectedIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    )
  }

  const handleSave = async () => {
    setIsSubmitting(true)

    try {
      await updateEmployeeServices(employeeId, selectedIds)
      toast.success("Serviços atualizados com sucesso!")
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar serviços.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={(triggerProps) => (
          <Button
            size="icon"
            variant="ghost"
            className="cursor-pointer"
            {...triggerProps}
          >
            <BriefcaseIcon size={16} />
          </Button>
        )}
      />
      <DialogContent className="w-[90%] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Serviços</DialogTitle>
          <DialogDescription>
            Selecione os serviços que este funcionário pode realizar.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 space-y-3 overflow-y-auto">
          {allServices.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum serviço cadastrado.
            </p>
          ) : (
            allServices.map((service) => (
              <div key={service.id} className="flex items-center gap-2">
                <Checkbox
                  id={`service-${service.id}`}
                  checked={selectedIds.includes(service.id)}
                  onCheckedChange={() => toggleService(service.id)}
                />
                <Label htmlFor={`service-${service.id}`}>{service.name}</Label>
              </div>
            ))
          )}
        </div>

        <Button
          className="w-full cursor-pointer py-5"
          disabled={isSubmitting}
          onClick={handleSave}
        >
          {isSubmitting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            "Salvar"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default EmployeeServicesDialog
