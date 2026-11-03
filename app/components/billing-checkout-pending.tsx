"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon } from "lucide-react"

const REFRESH_EVERY_MS = 3000
const MAX_REFRESHES = 10

// Shown after Stripe Checkout while the webhook has not confirmed the
// subscription yet. It re-renders the billing page every few seconds; once the
// page sees the subscription it renders the confirmation instead and this
// component unmounts. It gives up after ~30 s (the webhook may be delayed).
const BillingCheckoutPending = () => {
  const router = useRouter()
  const [gaveUp, setGaveUp] = useState(false)

  useEffect(() => {
    let count = 0
    const interval = setInterval(() => {
      count += 1
      router.refresh()
      if (count >= MAX_REFRESHES) {
        clearInterval(interval)
        setGaveUp(true)
      }
    }, REFRESH_EVERY_MS)

    return () => clearInterval(interval)
  }, [router])

  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400"
    >
      <Loader2Icon
        size={18}
        className={gaveUp ? "shrink-0" : "shrink-0 animate-spin"}
      />
      <span>
        {gaveUp
          ? "Pagamento recebido! A confirmação está demorando mais que o normal. Atualize a página em alguns instantes."
          : "Pagamento recebido! Estamos confirmando sua assinatura…"}
      </span>
    </div>
  )
}

export default BillingCheckoutPending
