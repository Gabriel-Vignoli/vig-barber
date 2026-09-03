import { toast } from "sonner"
import { CheckIcon } from "lucide-react"
import { Button } from "./ui/button"

interface ShowProfileUpdateSuccessToastParams {
  title: string
  description: string
}

export function showProfileUpdateSuccessToast({
  title,
  description,
}: ShowProfileUpdateSuccessToastParams) {
  toast.custom(
    (id) => (
      <div
        className="bg-popover mt-[18vh] flex w-[calc(100vw-2rem)] max-w-sm flex-col items-center gap-4 rounded-2xl border p-6 text-center shadow-lg"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex size-16 items-center justify-center rounded-full bg-green-600">
          <CheckIcon
            className="text-primary-foreground size-8"
            strokeWidth={3}
          />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        <Button
          className="w-full cursor-pointer py-5"
          onClick={() => toast.dismiss(id)}
        >
          Continuar
        </Button>
      </div>
    ),
    {
      duration: 5000,
      position: "top-center",
    },
  )
}
