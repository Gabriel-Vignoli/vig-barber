import type { Prisma } from "@/app/generated/prisma/client"

// Takes an employee out of one shop inside a transaction. With booking or
// review history the row is kept (inactive) so reports and past bookings
// still resolve; without history it is deleted (cascades to its services and
// schedules). The global User is never touched here.
export const removeEmployeeFromShop = async (
  tx: Prisma.TransactionClient,
  employee: { id: string },
  barbershopId: string,
) => {
  const [bookingCount, reviewCount] = await Promise.all([
    tx.booking.count({ where: { employeeId: employee.id, barbershopId } }),
    tx.review.count({ where: { employeeId: employee.id, barbershopId } }),
  ])

  if (bookingCount > 0 || reviewCount > 0) {
    const { count } = await tx.employee.updateMany({
      where: { id: employee.id, barbershopId },
      data: { isActive: false },
    })

    return { count, deactivated: true }
  }

  const { count } = await tx.employee.deleteMany({
    where: { id: employee.id, barbershopId },
  })

  return { count, deactivated: false }
}

// TODO(Phase 4c): drop once User.role is gone. Staff removed from their last
// shop go back to CLIENT, so the global role no longer opens staff screens
// (proxy.ts still reads it).
export const syncLegacyStaffRole = async (
  tx: Prisma.TransactionClient,
  userId: string,
) => {
  const memberships = await tx.membership.findMany({
    where: { userId },
    select: { role: true },
  })
  const roles = new Set(memberships.map((membership) => membership.role))

  if (!roles.has("EMPLOYEE")) {
    await tx.user.updateMany({
      where: { id: userId, role: "EMPLOYEE" },
      data: { role: "CLIENT" },
    })
  }

  if (!roles.has("ATENDENTE") && !roles.has("ADMIN")) {
    await tx.user.updateMany({
      where: { id: userId, role: "ATENDENTE" },
      data: { role: "CLIENT" },
    })
  }
}
