import { headers } from "next/headers"

const withoutTrailingSlash = (url: string) => url.replace(/\/+$/, "")

// Absolute origin for links that leave the app (emails). Order: an explicit
// APP_URL (or NEXTAUTH_URL), then the Vercel production domain. The request
// Host header is only trusted in development: in production a spoofed
// Host/X-Forwarded-Host would put a real invite token under an attacker's
// domain, so production never builds links from request headers.
export const getAppOrigin = async (): Promise<string> => {
  const configured = process.env.APP_URL || process.env.NEXTAUTH_URL

  if (configured) return withoutTrailingSlash(configured)

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL não configurada.")
  }

  try {
    const headerList = await headers()
    const host = headerList.get("host")

    if (host) {
      const protocol =
        host.startsWith("localhost") || host.startsWith("127.0.0.1")
          ? "http"
          : "https"

      return `${protocol}://${host}`
    }
  } catch {
    // Outside a request (scripts, tests)
  }

  return "http://localhost:3000"
}
