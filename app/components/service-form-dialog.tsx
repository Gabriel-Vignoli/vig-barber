"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { createService } from "../_actions/create-service"
import { updateService } from "../_actions/update-service"
import {
  serviceFormSchema,
  ServiceFormValues,
} from "../_lib/validations/service"

interface ServiceFormDialogProps {
  mode: "create" | "edit"
  serviceId?: string
  defaultValues?: ServiceFormValues
  renderTrigger: DialogPrimitive.Trigger.Props["render"]
}

const EMPTY_VALUES: ServiceFormValues = {
  name: "",
  description: "",
  price: 0,
  durationInMinutes: 30,
  imageUrl: "",
}

const ServiceFormDialog = ({
  mode,
  serviceId,
  defaultValues,
  renderTrigger,
}: ServiceFormDialogProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState, reset } =
    useForm<ServiceFormValues>({
      resolver: zodResolver(serviceFormSchema) as never,
      defaultValues: defaultValues ?? EMPTY_VALUES,
    })

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      reset(defaultValues ?? EMPTY_VALUES)
    }
  }

  const onSubmit = async (values: ServiceFormValues) => {
    setIsSubmitting(true)

    try {
      if (mode === "create") {
        await createService(values)
        toast.success("Serviço criado com sucesso!")
      } else {
        if (!serviceId) return
        await updateService(serviceId, values)
        toast.success("Serviço atualizado com sucesso!")
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar serviço.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={renderTrigger} />
      <DialogContent className="w-[90%] sm:max-w-lg xl:max-w-2xl xl:p-8">
        <DialogHeader>
          <DialogTitle className="xl:text-xl">
            {mode === "create" ? "Novo serviço" : "Editar serviço"}
          </DialogTitle>
          <DialogDescription className="xl:text-base">
            Preencha as informações do serviço.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 text-left xl:space-y-6"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-1">
            <Label htmlFor="service-name" className="xl:text-base">
              Nome
            </Label>
            <Input
              id="service-name"
              type="text"
              className="xl:p-5 xl:text-base"
              {...register("name")}
            />
            {formState.errors.name && (
              <p className="text-destructive text-xs">
                {formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="service-description" className="xl:text-base">
              Descrição
            </Label>
            <Textarea
              id="service-description"
              rows={3}
              className="xl:p-5 xl:text-base"
              {...register("description")}
            />
            {formState.errors.description && (
              <p className="text-destructive text-xs">
                {formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 xl:gap-6">
            <div className="space-y-1">
              <Label htmlFor="service-price" className="xl:text-base">
                Preço (R$)
              </Label>
              <Input
                id="service-price"
                type="number"
                step="0.01"
                min="0"
                className="xl:p-5 xl:text-base"
                {...register("price")}
              />
              {formState.errors.price && (
                <p className="text-destructive text-xs">
                  {formState.errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="service-duration" className="xl:text-base">
                Duração (min)
              </Label>
              <Input
                id="service-duration"
                type="number"
                min="1"
                className="xl:p-5 xl:text-base"
                {...register("durationInMinutes")}
              />
              {formState.errors.durationInMinutes && (
                <p className="text-destructive text-xs">
                  {formState.errors.durationInMinutes.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="service-image" className="xl:text-base">
              URL da imagem
            </Label>
            <Input
              id="service-image"
              type="text"
              placeholder="https://..."
              className="xl:p-5 xl:text-base"
              {...register("imageUrl")}
            />
            {formState.errors.imageUrl && (
              <p className="text-destructive text-xs">
                {formState.errors.imageUrl.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer gap-2 py-5 xl:p-6 xl:text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : mode === "create" ? (
              "Criar serviço"
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ServiceFormDialog
