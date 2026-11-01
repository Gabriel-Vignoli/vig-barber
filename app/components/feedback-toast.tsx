import { toast } from "sonner"
import { CheckIcon, XIcon, type LucideIcon } from "lucide-react"
import { cn } from "../_lib/utils"
import { Button } from "./ui/button"

// Large centered toast for moments that deserve the user's attention (a
// booking, a cancellation, login/logout, account changes). Routine admin
// feedback uses the small toast.success / toast.error instead.
type FeedbackVariant = "success" | "error" | "neutral"

interface FeedbackToastOptions {
  variant: FeedbackVariant
  title: string
  description?: string
  // Overrides the variant's default icon (e.g. LogOutIcon for sign-out)
  icon?: LucideIcon
  buttonLabel?: string
  // Milliseconds; Infinity keeps it until the user closes it
  duration?: number
}

const VARIANTS: Record<
  FeedbackVariant,
  {
    icon: LucideIcon
    circle: string
    iconClass: string
    buttonVariant: "default" | "outline"
    buttonLabel: string
  }
> = {
  success: {
    icon: CheckIcon,
    circle: "bg-green-600",
    iconClass: "text-primary-foreground size-8",
    buttonVariant: "default",
    buttonLabel: "Continuar",
  },
  error: {
    icon: XIcon,
    circle: "bg-destructive",
    iconClass: "text-primary-foreground size-8",
    buttonVariant: "outline",
    buttonLabel: "Fechar",
  },
  neutral: {
    icon: CheckIcon,
    circle: "bg-muted",
    iconClass: "text-foreground size-7",
    buttonVariant: "outline",
    buttonLabel: "Fechar",
  },
}

export function showFeedbackToast({
  variant,
  title,
  description,
  icon,
  buttonLabel,
  duration = 5000,
}: FeedbackToastOptions) {
  const style = VARIANTS[variant]
  const Icon = icon ?? style.icon

  toast.custom(
    (id) => (
      <div
        role={variant === "error" ? "alert" : "status"}
        className="bg-popover mt-[18vh] flex w-[calc(100vw-2rem)] max-w-sm flex-col items-center gap-4 rounded-2xl border p-6 text-center shadow-lg"
        // Keeps a click on the toast from closing the dialog behind it
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "flex size-16 items-center justify-center rounded-full",
            style.circle,
          )}
        >
          <Icon
            className={style.iconClass}
            strokeWidth={variant === "neutral" ? 2.5 : 3}
          />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold">{title}</h2>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>

        <Button
          variant={style.buttonVariant}
          className="w-full cursor-pointer py-5"
          onClick={() => toast.dismiss(id)}
        >
          {buttonLabel ?? style.buttonLabel}
        </Button>
      </div>
    ),
    { duration, position: "top-center" },
  )
}

// Used by both booking flows (service page and shop home)
export const showBookingSuccessToast = () =>
  showFeedbackToast({
    variant: "success",
    title: "Reserva Efetuada!",
    description: "Sua reserva foi agendada com sucesso.",
    buttonLabel: "Confirmar",
  })
