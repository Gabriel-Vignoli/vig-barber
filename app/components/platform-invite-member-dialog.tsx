"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2Icon, MailPlusIcon } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { inviteShopMember } from "../_actions/invite-shop-member"
import { MEMBER_ROLE_LABELS } from "../_constants/roles"
import {
  inviteMemberSchema,
  InviteMemberFormValues,
} from "../_lib/validations/platform"

interface PlatformInviteMemberDialogProps {
  shopId: string
  shopName: string
}

const PlatformInviteMemberDialog = ({
  shopId,
  shopName,
}: PlatformInviteMemberDialogProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState, reset, watch, setValue } =
    useForm<InviteMemberFormValues>({
      resolver: zodResolver(inviteMemberSchema) as never,
      defaultValues: { email: "", role: "ADMIN" },
    })

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) reset()
  }

  const onSubmit = async (values: InviteMemberFormValues) => {
    setIsSubmitting(true)

    try {
      await inviteShopMember(shopId, values)
      toast.success("Convite enviado!")
      setOpen(false)
      reset()
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao enviar convite.",
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
            <MailPlusIcon className="size-4" />
            Convidar
          </Button>
        )}
      />
      <DialogContent className="w-[90%] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar para {shopName}</DialogTitle>
          <DialogDescription>
            A pessoa recebe um link por email, válido por 7 dias. Um novo
            convite para o mesmo email substitui o anterior.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 text-left"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-1">
            <Label htmlFor={`invite-email-${shopId}`}>Email</Label>
            <Input
              id={`invite-email-${shopId}`}
              type="email"
              {...register("email")}
            />
            {formState.errors.email && (
              <p className="text-destructive text-xs">
                {formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor={`invite-role-${shopId}`}>Papel</Label>
            <Select
              items={MEMBER_ROLE_LABELS}
              value={watch("role")}
              onValueChange={(value) =>
                setValue("role", value as InviteMemberFormValues["role"])
              }
            >
              <SelectTrigger id={`invite-role-${shopId}`} className="w-full">
                <SelectValue placeholder="Selecione um papel" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MEMBER_ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formState.errors.role && (
              <p className="text-destructive text-xs">
                {formState.errors.role.message}
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
              "Enviar convite"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default PlatformInviteMemberDialog
