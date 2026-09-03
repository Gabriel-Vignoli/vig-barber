"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PencilIcon, StarIcon, Trash2Icon } from "lucide-react"
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
import ReviewFormDialog from "./review-form-dialog"
import { deleteReview } from "../_actions/delete-review"

interface ReviewData {
  id: string
  rating: number
  comment: string | null
  userId: string
  user: {
    name: string | null
    image: string | null
  }
}

interface EmployeeReviewsProps {
  employeeId: string
  reviews: ReviewData[]
  currentUserId: string | null
  reviewableBookingId: string | null
}

const EmployeeReviews = ({
  employeeId,
  reviews,
  currentUserId,
  reviewableBookingId,
}: EmployeeReviewsProps) => {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpenId, setDeleteDialogOpenId] = useState<string | null>(
    null,
  )

  const userReview = currentUserId
    ? reviews.find((review) => review.userId === currentUserId)
    : undefined

  const handleDelete = async (reviewId: string) => {
    setIsDeleting(true)

    try {
      await deleteReview(reviewId)
      toast.success("Avaliação removida.")
      setDeleteDialogOpenId(null)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao remover avaliação.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-400 uppercase xl:text-lg">
          Avaliações
        </h3>

        {currentUserId && !userReview && reviewableBookingId && (
          <ReviewFormDialog
            mode="create"
            employeeId={employeeId}
            bookingId={reviewableBookingId}
            renderTrigger={(triggerProps) => (
              <Button
                size="sm"
                className="cursor-pointer gap-2"
                {...triggerProps}
              >
                <StarIcon size={16} />
                Avaliar
              </Button>
            )}
          />
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm xl:text-base">
          Este profissional ainda não possui avaliações.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const isOwnReview = review.userId === currentUserId

            return (
              <Card key={review.id} className="p-0">
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {review.user.name ?? "Cliente"}
                      {isOwnReview && (
                        <span className="text-muted-foreground ml-2 text-xs font-normal">
                          (Você)
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-1">
                      <StarIcon
                        className="text-primary fill-primary"
                        size={14}
                      />
                      <p className="text-sm font-medium">
                        {review.rating.toFixed(1).replace(".", ",")}
                      </p>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-400">{review.comment}</p>
                  )}

                  {isOwnReview && (
                    <div className="flex justify-end gap-2 pt-2">
                      <ReviewFormDialog
                        mode="edit"
                        employeeId={employeeId}
                        reviewId={review.id}
                        defaultValues={{
                          rating: review.rating,
                          comment: review.comment,
                        }}
                        renderTrigger={(triggerProps) => (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="cursor-pointer"
                            {...triggerProps}
                          >
                            <PencilIcon size={14} />
                          </Button>
                        )}
                      />

                      <AlertDialog
                        open={deleteDialogOpenId === review.id}
                        onOpenChange={(isOpen) =>
                          setDeleteDialogOpenId(isOpen ? review.id : null)
                        }
                      >
                        <AlertDialogTrigger
                          render={(triggerProps) => (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="text-destructive cursor-pointer"
                              {...triggerProps}
                            >
                              <Trash2Icon size={14} />
                            </Button>
                          )}
                        />
                        <AlertDialogContent size="sm">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remover avaliação
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover sua avaliação?
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
                                handleDelete(review.id)
                              }}
                            >
                              {isDeleting ? "Removendo..." : "Confirmar"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default EmployeeReviews
