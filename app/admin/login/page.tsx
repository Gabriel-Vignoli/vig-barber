import { redirect } from "next/navigation"
import { getSafeCallbackUrl } from "@/app/_lib/safe-callback-url"
import { getLoginPath } from "@/app/_lib/protected-paths"

// Legacy /admin/login: the global /login replaces it (keeps a safe callbackUrl)
// TODO(Phase 8): remove the legacy redirects
const LegacyAdminLoginPage = async ({
  searchParams,
}: PageProps<"/admin/login">) => {
  const { callbackUrl } = await searchParams

  redirect(getLoginPath(getSafeCallbackUrl(callbackUrl)))
}

export default LegacyAdminLoginPage
