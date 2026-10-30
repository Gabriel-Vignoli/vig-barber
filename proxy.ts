import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { isProtectedPath } from "./app/_lib/protected-paths"

// Optimistic check only: protected paths need a session, otherwise the user
// goes to /login and comes back afterwards. Roles are never read here; the
// pages check the membership in the shop with requireShopRole.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXT_AUTH_SECRET,
  })

  if (token) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = "/login"
  url.search = `?callbackUrl=${encodeURIComponent(`${pathname}${search}`)}`

  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
