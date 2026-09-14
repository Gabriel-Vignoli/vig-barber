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
  onSuccess: () => void
}

const PhoneCollectionDialog = ({
  open,
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
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="w-[90%] sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="bg-primary/10 mb-2 flex size-12 items-center justify-center rounded-full">
            <PhoneIcon size={22} className="text-primary" />
          </div>
          <DialogTitle>Precisamos do seu telefone</DialogTitle>
          <DialogDescription>
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
            <Label htmlFor="user-phone">Telefone</Label>
            <Input
              id="user-phone"
              type="tel"
              placeholder="(35) 99201-1313"
              {...register("phone")}
            />
            {formState.errors.phone && (
              <p className="text-destructive text-xs">
                {formState.errors.phone.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer py-5"
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
