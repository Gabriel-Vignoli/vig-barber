"use server"

import { getSessionUserId } from "../_lib/tenant"
import { getStaffLandingPath as findStaffLandingPath } from "../_lib/staff-shop"

// Called by the admin login form right after signIn to pick the redirect
export const getStaffLandingPath = async () => {
  const userId = await getSessionUserId()

  if (!userId) return null

  return findStaffLandingPath(userId)
}
