import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { prisma } from "../_lib/prisma"

const getCurrentEmployee = async () => {
  const session = await getServerSession(authOptions)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session?.user as any)?.id

  if (!userId) return null

  return prisma.employee.findUnique({
    where: { userId },
    select: { id: true },
  })
}

export const getEmployeeUpcomingBookings = async () => {
  const employee = await getCurrentEmployee()
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

export const getEmployeeConcludedBookings = async () => {
  const employee = await getCurrentEmployee()
  if (!employee) return []

  return prisma.booking.findMany({
    where: {
      employeeId: employee.id,
      status: { not: "CANCELLED" },
      OR: [{ status: "COMPLETED" }, { bookingDate: { lt: new Date() } }],
    },
    include: {
      user: { select: { name: true, image: true } },
      barbershopService: { select: { name: true, durationInMinutes: true } },
    },
    orderBy: { bookingDate: "desc" },
  })
}
