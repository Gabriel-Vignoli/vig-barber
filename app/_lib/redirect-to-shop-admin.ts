import { redirect } from "next/navigation"
import { getSessionUserId } from "./tenant"
import { getFirstShopWithRole } from "./staff-shop"

type SearchParams = Record<string, string | string[] | undefined>

// Legacy /admin/<section> URLs from the single-shop era: send the admin to the
// same section of their shop. Temporary (307) because the target depends on
// who is signed in.
// TODO(Phase 4c): replaced by next.config redirects to /painel
export const redirectToShopAdmin = async (
  section: string | null,
  searchParams: SearchParams,
): Promise<never> => {
  const userId = await getSessionUserId()

  if (!userId) {
    redirect("/admin/login")
  }

  const shop = await getFirstShopWithRole(userId, ["ADMIN"])

  if (!shop) {
    redirect("/")
  }

  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) query.append(key, item)
    }
  }

  const path = `/b/${shop.slug}/admin${section ? `/${section}` : ""}`
  const queryString = query.toString()

  redirect(queryString ? `${path}?${queryString}` : path)
}
