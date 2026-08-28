import { toast } from "sonner"
import { CheckIcon } from "lucide-react"
import { Button } from "./ui/button"

export function showBookingSuccessToast() {
  toast.custom(
    (id) => (
      <div className="bg-popover mt-[18vh] flex w-[calc(100vw-2rem)] max-w-sm flex-col items-center gap-4 rounded-2xl border p-6 text-center shadow-lg">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-600">
          <CheckIcon
            className="text-primary-foreground size-8"
            strokeWidth={3}
          />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold">Reserva Efetuada!</h2>
          <p className="text-muted-foreground text-sm">
            Sua reserva foi agendada com sucesso.
          </p>
        </div>

        <Button
          className="w-full cursor-pointer py-5"
          onClick={() => toast.dismiss(id)}
        >
          Confirmar
        </Button>
      </div>
    ),
    {
      duration: Infinity,
      position: "top-center",
    },
  )
}
