"use server"

import { getSessionUserId } from "../_lib/tenant"
import { prisma } from "../_lib/prisma"

// Whether the signed-in user is staff of any active shop. The headers use it
// to show the "Minhas barbearias" link (roles are not in the session).
export const getHasStaffMembership = async () => {
  const userId = await getSessionUserId()

  if (!userId) return false

  const membership = await prisma.membership.findFirst({
    where: { userId, barbershop: { status: "ACTIVE" } },
    select: { id: true },
  })

  return !!membership
}
