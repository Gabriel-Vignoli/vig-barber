"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2Icon, PhoneIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { updatePhone } from "../_actions/update-phone"
import { phoneFormSchema, PhoneFormValues } from "../_lib/validations/phone"

interface PhoneCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const PhoneCollectionDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: PhoneCollectionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: { phone: "" },
  })

  const onSubmit = async (values: PhoneFormValues) => {
    setIsSubmitting(true)

    try {
      await updatePhone(values)
      toast.success("Telefone salvo com sucesso!")
      onSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar telefone.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] sm:max-w-md lg:max-w-lg">
        <DialogHeader>
          <div className="bg-primary/10 mb-2 flex size-12 items-center justify-center rounded-full lg:size-14">
            <PhoneIcon size={22} className="text-primary lg:size-6" />
          </div>
          <DialogTitle className="lg:text-xl">
            Precisamos do seu telefone
          </DialogTitle>
          <DialogDescription className="lg:text-base">
            Para confirmar seu agendamento, informe um número de contato. A
            barbearia pode usá-lo para falar com você sobre sua reserva.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 text-left"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-1">
            <Label htmlFor="user-phone" className="lg:bb-3 mb-2 lg:text-base">
              Telefone
            </Label>
            <Input
              id="user-phone"
              type="tel"
              placeholder="(35) 99201-1313"
              className="lg:h-11 lg:text-base"
              {...register("phone")}
            />
            {formState.errors.phone && (
              <p className="text-destructive text-xs lg:text-sm">
                {formState.errors.phone.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer py-5 lg:py-6 lg:text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              "Salvar e continuar"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default PhoneCollectionDialog
