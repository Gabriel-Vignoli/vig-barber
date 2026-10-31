import Stripe from "stripe"

let client: Stripe | null = null
let clientKey: string | null = null

// Built on first use (never at import time), so the build and the pages work
// without Stripe keys. Returns null while STRIPE_SECRET_KEY is unset.
export const getStripe = (): Stripe | null => {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) return null

  if (!client || clientKey !== secretKey) {
    client = new Stripe(secretKey)
    clientKey = secretKey
  }

  return client
}
