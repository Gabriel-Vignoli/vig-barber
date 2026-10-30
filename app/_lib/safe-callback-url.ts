const BASE = "http://callback.local"

// Returns the callbackUrl only when it is a same-origin relative path, so a
// login link can never send the user to another site (open redirect).
// Rejects "//evil.com", "/\evil.com", "https://evil.com", backslashes and
// control characters anywhere, and /login itself (redirect loop).
export const getSafeCallbackUrl = (value: unknown): string | null => {
  if (typeof value !== "string" || value.length === 0) return null

  if (!value.startsWith("/")) return null
  if (value.startsWith("//") || value.startsWith("/\\")) return null
  // Browsers treat "\" like "/", and control characters can be stripped,
  // which turns "/\t/evil.com" into "//evil.com"
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null

  let url: URL
  try {
    url = new URL(value, BASE)
  } catch {
    return null
  }

  if (url.origin !== BASE) return null
  // Dot segments collapse during parsing ("/.//evil.com" → "//evil.com"),
  // so check the normalised path again
  if (url.pathname.startsWith("//") || url.pathname.startsWith("/\\")) {
    return null
  }
  let pathname: string
  try {
    pathname = decodeURIComponent(url.pathname).toLowerCase()
  } catch {
    return null
  }
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return null
  }

  return `${url.pathname}${url.search}${url.hash}`
}
