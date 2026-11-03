"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { CalendarPlusIcon, Loader2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { extendTrial } from "../_actions/extend-trial"
import {
  extendTrialSchema,
  ExtendTrialFormValues,
  MAX_TRIAL_EXTENSION_DAYS,
} from "../_lib/validations/platform"
import { formatBrazilDate } from "../_lib/timezone"
import { TRIAL_DAYS } from "../_lib/plans"
import { unwrap } from "../_lib/action-result"

interface PlatformExtendTrialDialogProps {
  shopId: string
  shopName: string
}

const PlatformExtendTrialDialog = ({
  shopId,
  shopName,
}: PlatformExtendTrialDialogProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState, reset } =
    useForm<ExtendTrialFormValues>({
      resolver: zodResolver(extendTrialSchema) as never,
      defaultValues: { days: TRIAL_DAYS },
    })

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) reset()
  }

  const onSubmit = async (values: ExtendTrialFormValues) => {
    setIsSubmitting(true)

    try {
      const { trialEndsAt } = await unwrap(extendTrial(shopId, values.days))
      toast.success(
        `Teste estendido até ${formatBrazilDate(new Date(trialEndsAt), { withYear: true })}.`,
      )
      setOpen(false)
      reset()
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao estender o teste.",
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
            variant="outline"
            size="sm"
            className="cursor-pointer"
            {...triggerProps}
          >
            <CalendarPlusIcon className="size-4" />
            Estender teste
          </Button>
        )}
      />
      <DialogContent className="w-[90%] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Estender teste de {shopName}</DialogTitle>
          <DialogDescription>
            Os dias são somados ao fim do teste atual, ou a partir de hoje se o
            teste já terminou. A barbearia volta a funcionar na hora.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 text-left"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-1">
            <Label htmlFor={`extend-trial-days-${shopId}`}>Dias</Label>
            <Input
              id={`extend-trial-days-${shopId}`}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_TRIAL_EXTENSION_DAYS}
              step={1}
              {...register("days")}
            />
            {formState.errors.days && (
              <p className="text-destructive text-xs">
                {formState.errors.days.message}
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
              "Estender teste"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default PlatformExtendTrialDialog
