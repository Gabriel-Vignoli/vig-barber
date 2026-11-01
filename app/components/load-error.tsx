import { RotateCwIcon, TriangleAlertIcon } from "lucide-react"
import { cn } from "../_lib/utils"
import { Button } from "./ui/button"

// Inline error state for a card or chart whose data failed to load
export function LoadError({
  onRetry,
  message = "Não foi possível carregar os dados.",
  className,
}: {
  onRetry: () => void
  message?: string
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center",
        className,
      )}
    >
      <TriangleAlertIcon className="text-destructive size-6" />
      <p className="text-muted-foreground text-sm">{message}</p>
      <Button
        variant="outline"
        size="sm"
        className="cursor-pointer gap-2"
        onClick={onRetry}
      >
        <RotateCwIcon size={14} />
        Tentar novamente
      </Button>
    </div>
  )
}
