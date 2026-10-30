"use server"

import { getSessionUserId } from "../_lib/tenant"
import { resolvePostLoginPath } from "../_lib/staff-shop"

// Called by the login form right after signIn to pick the redirect. The
// callbackUrl is re-checked here: only same-origin relative paths are used.
export const getPostLoginPath = async (callbackUrl?: string | null) => {
  const userId = await getSessionUserId()

  if (!userId) return "/login"

  return resolvePostLoginPath(userId, callbackUrl)
}
