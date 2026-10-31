"use server"

import { getShopAreaPath } from "../_constants/roles"
import { prisma } from "../_lib/prisma"
import { getSessionUserId } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import { hashInvitationToken, isInvitationExpired } from "../_lib/invitation"

// Accepts an invitation for the signed-in user, whose email must match the
// invited one. Creates the Membership (plus the Employee row for a barber) and
// marks the invitation as used, all in one transaction. Returns the area of
// the shop to open next.
export const acceptInvitation = async (
  token: string,
): Promise<{ path: string; alreadyMember: boolean }> => {
  const userId = await getSessionUserId()

  if (!userId) {
    throw new Error("Você precisa estar logado.")
  }

  if (typeof token !== "string" || token.length === 0 || token.length > 128) {
    throw new Error("Convite inválido.")
  }

  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      barbershop: { select: { id: true, slug: true, status: true } },
    },
  })

  if (!invitation) {
    throw new Error("Convite inválido.")
  }

  if (invitation.acceptedAt) {
    throw new Error("Este convite já foi usado.")
  }

  if (isInvitationExpired(invitation)) {
    throw new Error("Este convite expirou. Peça um novo convite.")
  }

  const shop = invitation.barbershop

  if (shop.status !== "ACTIVE") {
    throw new Error("Barbearia não encontrada.")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  if (
    !user?.email ||
    user.email.trim().toLowerCase() !== invitation.email.trim().toLowerCase()
  ) {
    throw new Error(
      `Este convite foi enviado para ${invitation.email}. Entre com essa conta para aceitar.`,
    )
  }

  const result = await prisma.$transaction(async (tx) => {
    // Conditional update: two concurrent accepts cannot both succeed
    const { count } = await tx.invitation.updateMany({
      where: { id: invitation.id, barbershopId: shop.id, acceptedAt: null },
      data: { acceptedAt: new Date() },
    })

    if (count !== 1) {
      throw new Error("Este convite já foi usado.")
    }

    const membership = await tx.membership.findUnique({
      where: { userId_barbershopId: { userId, barbershopId: shop.id } },
      select: { role: true },
    })

    if (!membership) {
      await tx.membership.create({
        data: { userId, barbershopId: shop.id, role: invitation.role },
      })
    }

    // One role per shop: an existing member keeps their role. An ADMIN
    // invited as barber still gets the Employee row (an owner who cuts hair).
    const addsEmployeeRow =
      invitation.role === "EMPLOYEE" &&
      (!membership || membership.role === "ADMIN")

    let employeeChanged = false

    if (addsEmployeeRow) {
      const employee = await tx.employee.findUnique({
        where: { userId_barbershopId: { userId, barbershopId: shop.id } },
        select: { id: true, isActive: true },
      })

      if (!employee) {
        await tx.employee.create({ data: { userId, barbershopId: shop.id } })
        employeeChanged = true
      } else if (!employee.isActive) {
        // A barber removed earlier (kept inactive for their history) is back
        await tx.employee.updateMany({
          where: { id: employee.id, barbershopId: shop.id },
          data: { isActive: true },
        })
        employeeChanged = true
      }
    }

    return {
      role: membership?.role ?? invitation.role,
      alreadyMember: !!membership && !employeeChanged,
    }
  })

  revalidateShop(shop)

  return {
    path: getShopAreaPath(shop.slug, result.role),
    alreadyMember: result.alreadyMember,
  }
}
