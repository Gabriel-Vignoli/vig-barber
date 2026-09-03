"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Button } from "./ui/button"
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
import StarRatingInput from "./star-rating-input"
import { createReview } from "../_actions/create-review"
import { updateReview } from "../_actions/update-review"
import { reviewFormSchema, ReviewFormValues } from "../_lib/validations/review"

interface ReviewFormDialogProps {
  mode: "create" | "edit"
  employeeId: string
  bookingId?: string
  reviewId?: string
  defaultValues?: { rating: number; comment?: string | null }
  renderTrigger: DialogPrimitive.Trigger.Props["render"]
}

const ReviewFormDialog = ({
  mode,
  employeeId,
  bookingId,
  reviewId,
  defaultValues,
  renderTrigger,
}: ReviewFormDialogProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { control, register, handleSubmit, formState, reset } =
    useForm<ReviewFormValues>({
      resolver: zodResolver(reviewFormSchema),
      defaultValues: {
        rating: defaultValues?.rating ?? 0,
        comment: defaultValues?.comment ?? "",
      },
    })

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      reset({
        rating: defaultValues?.rating ?? 0,
        comment: defaultValues?.comment ?? "",
      })
    }
  }

  const onSubmit = async (values: ReviewFormValues) => {
    setIsSubmitting(true)

    try {
      if (mode === "create") {
        if (!bookingId) return
        await createReview({
          bookingId,
          employeeId,
          rating: values.rating,
          comment: values.comment,
        })
        toast.success("Avaliação enviada com sucesso!")
      } else {
        if (!reviewId) return
        await updateReview({
          reviewId,
          rating: values.rating,
          comment: values.comment,
        })
        toast.success("Avaliação atualizada com sucesso!")
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao enviar avaliação.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={renderTrigger} />
      <DialogContent className="w-[90%] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Avaliar profissional" : "Editar avaliação"}
          </DialogTitle>
          <DialogDescription>Conte como foi sua experiência.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 text-left"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-1">
            <Label>Nota</Label>
            <Controller
              control={control}
              name="rating"
              render={({ field }) => (
                <StarRatingInput
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {formState.errors.rating && (
              <p className="text-destructive text-xs">
                {formState.errors.rating.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="review-comment">Comentário (opcional)</Label>
            <Textarea id="review-comment" rows={4} {...register("comment")} />
            {formState.errors.comment && (
              <p className="text-destructive text-xs">
                {formState.errors.comment.message}
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
            ) : mode === "create" ? (
              "Enviar avaliação"
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ReviewFormDialog
