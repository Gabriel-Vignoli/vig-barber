"use server"

import type { Prisma } from "@/app/generated/prisma/client"
import { prisma } from "../_lib/prisma"
import { getSessionUserId } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import { removeEmployeeFromShop } from "../_lib/staff-removal"
import { action, ActionError } from "../_lib/action-result"

// Shown wherever the shop's history still points at this user
const ANONYMOUS_USER_NAME = "Usuário anônimo"

// Refuses what would leave someone else stranded: a shop with no admin, or
// clients waiting for a barber who no longer exists
const assertCanDelete = async (
  tx: Prisma.TransactionClient,
  userId: string,
) => {
  const soleAdmin = await tx.membership.findFirst({
    where: {
      userId,
      role: "ADMIN",
      barbershop: {
        memberships: { none: { userId: { not: userId }, role: "ADMIN" } },
      },
    },
    select: { barbershop: { select: { name: true } } },
  })

  if (soleAdmin) {
    throw new ActionError(
      `Você é o único administrador de ${soleAdmin.barbershop.name}. Fale com o suporte para transferir ou encerrar a barbearia antes de excluir sua conta.`,
    )
  }

  // Only a barber still working: someone already removed from the shop, or
  // whose shop is suspended, has nobody to ask and would be stuck here
  const upcomingAppointment = await tx.booking.findFirst({
    where: {
      employee: {
        userId,
        isActive: true,
        barbershop: { status: "ACTIVE" },
      },
      status: "PENDING",
      bookingDate: { gt: new Date() },
    },
    select: { id: true },
  })

  if (upcomingAppointment) {
    throw new ActionError(
      "Você tem atendimentos agendados como profissional. Peça à barbearia para remarcá-los antes de excluir sua conta.",
    )
  }
}

// Anonymizes the signed-in user (the LGPD deletion request). The row stays so
// shops keep their booking history and totals, and Consent rows stay as
// evidence, but nothing left on it identifies the person. The shop is never
// taken from the client: everything is reached through the user's own rows.
export const deleteAccount = action(async (confirmEmail: string) => {
  const userId = await getSessionUserId()

  if (!userId) {
    throw new ActionError("Você precisa estar logado.")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, isPlatformAdmin: true },
  })

  const email = user?.email

  if (!user || !email) {
    throw new ActionError("Conta não encontrada.")
  }

  if (
    typeof confirmEmail !== "string" ||
    confirmEmail.trim().toLowerCase() !== email.trim().toLowerCase()
  ) {
    throw new ActionError("O email digitado não confere.")
  }

  if (user.isPlatformAdmin) {
    throw new ActionError(
      "Contas de administrador da plataforma não podem ser excluídas por aqui.",
    )
  }

  const shops = await prisma.barbershop.findMany({
    where: {
      OR: [
        { memberships: { some: { userId } } },
        { employees: { some: { userId } } },
        { bookings: { some: { userId } } },
      ],
    },
    select: { id: true, slug: true },
  })

  // Serializable: two co-admins leaving at once cannot both pass the check
  await prisma.$transaction(
    async (tx) => {
      await assertCanDelete(tx, userId)

      // Conditional update: a second submit finds nothing to anonymize
      const { count } = await tx.user.updateMany({
        where: { id: userId, deletedAt: null },
        data: {
          name: ANONYMOUS_USER_NAME,
          email: null,
          emailVerified: null,
          image: null,
          phone: null,
          password: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
          deletedAt: new Date(),
        },
      })

      if (count !== 1) {
        throw new ActionError("Conta não encontrada.")
      }

      await tx.booking.updateMany({
        where: { userId, status: "PENDING", bookingDate: { gt: new Date() } },
        data: { status: "CANCELLED" },
      })

      const employees = await tx.employee.findMany({
        where: { userId, isActive: true },
        select: { id: true, barbershopId: true },
      })

      for (const employee of employees) {
        await removeEmployeeFromShop(tx, employee, employee.barbershopId)
      }

      // Rows kept for their history lose whatever described the person
      await tx.employee.updateMany({
        where: { userId },
        data: { isActive: false, phone: null, bio: null, imageUrl: null },
      })

      await tx.membership.deleteMany({ where: { userId } })
      await tx.account.deleteMany({ where: { userId } })
      await tx.session.deleteMany({ where: { userId } })
      await tx.passwordResetCode.deleteMany({ where: { email } })
      // Accepted ones only. Sign-up does not verify emails, so owning this
      // address proves nothing: deleting pending invitations would let anyone
      // cancel another shop's invite (even a new shop's owner) by registering
      // the invited email. Pending rows simply expire.
      await tx.invitation.deleteMany({
        where: {
          email: { equals: email, mode: "insensitive" },
          acceptedAt: { not: null },
        },
      })
    },
    { isolationLevel: "Serializable" },
  )

  for (const shop of shops) {
    revalidateShop(shop)
  }
})
