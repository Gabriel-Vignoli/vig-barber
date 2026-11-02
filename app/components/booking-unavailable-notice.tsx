import { CalendarOffIcon } from "lucide-react"
import { cn } from "../_lib/utils"

// Public shop pages of a shop whose subscription is pending: the page stays
// up (links people already have keep working), but it takes no bookings.
// Customers are not told why.
const BookingUnavailableNotice = ({ className }: { className?: string }) => (
  <div
    role="status"
    className={cn(
      "bg-muted/60 text-muted-foreground flex items-center gap-3 rounded-xl border p-4 text-sm md:text-base",
      className,
    )}
  >
    <CalendarOffIcon size={20} className="shrink-0" />
    <p>
      <span className="text-foreground font-semibold">
        Agendamentos indisponíveis no momento.
      </span>{" "}
      Tente novamente mais tarde.
    </p>
  </div>
)

export default BookingUnavailableNotice
