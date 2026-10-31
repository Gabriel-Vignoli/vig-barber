"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BanIcon, CircleCheckIcon } from "lucide-react"
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
import { updateShopStatus } from "../_actions/update-shop-status"

interface PlatformShopStatusButtonProps {
  shopId: string
  shopName: string
  status: "ACTIVE" | "SUSPENDED"
}

const PlatformShopStatusButton = ({
  shopId,
  shopName,
  status,
}: PlatformShopStatusButtonProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const suspend = status === "ACTIVE"

  const handleConfirm = async () => {
    setIsSubmitting(true)

    try {
      await updateShopStatus(shopId, suspend ? "SUSPENDED" : "ACTIVE")
      toast.success(suspend ? "Barbearia suspensa." : "Barbearia reativada.")
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao alterar o status.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={(triggerProps) => (
          <Button
            variant={suspend ? "destructive" : "outline"}
            size="sm"
            className="cursor-pointer"
            {...triggerProps}
          >
            {suspend ? (
              <BanIcon className="size-4" />
            ) : (
              <CircleCheckIcon className="size-4" />
            )}
            {suspend ? "Suspender" : "Reativar"}
          </Button>
        )}
      />
      <AlertDialogContent className="w-[90%]">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {suspend ? "Suspender" : "Reativar"} {shopName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {suspend
              ? "A página da barbearia sai do ar e a equipe perde o acesso. Nenhum dado é apagado."
              : "A página da barbearia volta ao ar e a equipe recupera o acesso."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            className="cursor-pointer"
            disabled={isSubmitting}
            onClick={handleConfirm}
          >
            {suspend ? "Suspender" : "Reativar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default PlatformShopStatusButton
