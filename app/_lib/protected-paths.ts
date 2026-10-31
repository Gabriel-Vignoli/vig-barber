// Paths that need a signed-in user. proxy.ts only checks that a session
// exists (an optimistic check); the pages still check the membership with
// requireShopRole.
const PROTECTED_PATHS = [
  /^\/painel(?:\/|$)/,
  /^\/platform(?:\/|$)/,
  /^\/bookings(?:\/|$)/,
  /^\/profile(?:\/|$)/,
  /^\/b\/[^/]+\/(?:admin|atendente|staff)(?:\/|$)/,
  // Legacy /admin/* redirects need the user to pick their shop; the old
  // /admin/login itself stays public (it forwards to /login)
  /^\/admin(?:$|\/(?!login(?:\/|$)))/,
]

export const isProtectedPath = (pathname: string) =>
  PROTECTED_PATHS.some((pattern) => pattern.test(pathname))

export const getLoginPath = (callbackUrl?: string | null) =>
  callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/login"
