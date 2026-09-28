import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { prisma } from "../_lib/prisma"

export const getEmployeeUpcomingBookings = async () => {
  const session = await getServerSession(authOptions)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session?.user as any)?.id

  if (!userId) return []

  const employee = await prisma.employee.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (!employee) return []

  return prisma.booking.findMany({
    where: {
      employeeId: employee.id,
      bookingDate: { gte: new Date() },
      status: { not: "CANCELLED" },
    },
    include: {
      user: { select: { name: true, image: true } },
      barbershopService: { select: { name: true, durationInMinutes: true } },
    },
    orderBy: { bookingDate: "asc" },
  })
}
