import { toast } from "sonner"
import { XIcon } from "lucide-react"
import { Button } from "./ui/button"

export function showBookingCancelToast() {
  toast.custom(
    (id) => (
      <div className="bg-popover mt-[18vh] flex w-[calc(100vw-2rem)] max-w-sm flex-col items-center gap-4 rounded-2xl border p-6 text-center shadow-lg">
        <div className="bg-destructive flex size-16 items-center justify-center rounded-full">
          <XIcon className="text-primary-foreground size-8" strokeWidth={3} />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold">Reserva Cancelada</h2>
          <p className="text-muted-foreground text-sm">
            Sua reserva foi cancelada com sucesso.
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full cursor-pointer py-5"
          onClick={() => toast.dismiss(id)}
        >
          Fechar
        </Button>
      </div>
    ),
    {
      duration: Infinity,
      position: "top-center",
    },
  )
}
