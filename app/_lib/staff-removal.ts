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
