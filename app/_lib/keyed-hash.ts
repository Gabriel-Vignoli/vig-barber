import { createHmac } from "crypto"

// For low-entropy values (6-digit codes, IPs, emails). A plain hash of these
// can be reversed by trying every value; this one needs the server secret.
export const keyedHash = (value: string) => {
  const secret = process.env.NEXT_AUTH_SECRET

  if (!secret) {
    throw new Error("NEXT_AUTH_SECRET is not set")
  }

  return createHmac("sha256", secret).update(value).digest("hex")
}
