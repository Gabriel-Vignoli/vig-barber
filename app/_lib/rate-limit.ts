import { headers } from "next/headers"
import { ActionError } from "./action-result"
import { keyedHash } from "./keyed-hash"
import { prisma } from "./prisma"

// Vercel sets x-real-ip itself, so a client cannot choose it. Off Vercel these
// headers are whatever the client sent, and the IP limits stop meaning anything.
export const getClientIp = async () => {
  const requestHeaders = await headers()

  return (
    requestHeaders.get("x-real-ip") ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  )
}

type Limit = { limit: number; windowMs: number }

// Counts one attempt and says if it went past the limit. The counter lives in
// Postgres because serverless instances share no memory, and the single upsert
// keeps parallel requests from reading the same count. Only a keyed hash of
// the IP or email is stored.
export const isRateLimited = async (
  scope: string,
  id: string,
  { limit, windowMs }: Limit,
) => {
  const key = keyedHash(`${scope}:${id.trim().toLowerCase()}`)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + windowMs)

  const [{ count }] = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."expiresAt" <= ${now} THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "expiresAt" = CASE
        WHEN "RateLimit"."expiresAt" <= ${now} THEN EXCLUDED."expiresAt"
        ELSE "RateLimit"."expiresAt"
      END
    RETURNING "count"
  `

  // A new window is a good moment to sweep the old ones. Housekeeping must not
  // fail the sign-up or reset that happened to trigger it.
  if (count === 1) {
    await prisma.rateLimit
      .deleteMany({ where: { expiresAt: { lte: now } } })
      .catch((error) => console.error(error))
  }

  return count > limit
}

export const assertRateLimit = async (
  scope: string,
  id: string,
  limit: Limit,
) => {
  if (await isRateLimited(scope, id, limit)) {
    throw new ActionError("Muitas tentativas. Tente novamente mais tarde.")
  }
}
