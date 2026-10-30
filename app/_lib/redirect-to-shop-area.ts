import { redirect } from "next/navigation"
import type { MemberRole } from "@/app/generated/prisma/enums"
import { getSessionUserId } from "./tenant"
import { getFirstShopWithRole } from "./staff-shop"
import { getLoginPath } from "./protected-paths"

type SearchParams = Record<string, string | string[] | undefined>

interface RedirectToShopAreaOptions {
  // The area under /b/<slug>, e.g. "admin" or "atendente"
  area: string
  // Roles that open this area; the user's oldest active shop with one wins
  roles: MemberRole[]
  section?: string | null
  searchParams?: SearchParams
}

// Legacy URLs from the single-shop era (/admin/*, /admin/atendente/*): send
// the user to the same section of their shop. Temporary (307) because the
// target depends on who is signed in.
// TODO(Phase 8): remove with the legacy redirects
export const redirectToShopArea = async ({
  area,
  roles,
  section = null,
  searchParams = {},
}: RedirectToShopAreaOptions): Promise<never> => {
  const userId = await getSessionUserId()

  if (!userId) {
    redirect(getLoginPath())
  }

  const shop = await getFirstShopWithRole(userId, roles)

  if (!shop) {
    redirect("/")
  }

  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) query.append(key, item)
    }
  }

  const path = `/b/${shop.slug}/${area}${section ? `/${section}` : ""}`
  const queryString = query.toString()

  redirect(queryString ? `${path}?${queryString}` : path)
}
