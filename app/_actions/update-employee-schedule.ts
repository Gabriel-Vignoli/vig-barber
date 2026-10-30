"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import {
  employeeScheduleSchema,
  EmployeeScheduleEntry,
} from "../_lib/validations/schedule"

export const updateEmployeeSchedule = async (
  slug: string,
  employeeId: string,
  schedules: EmployeeScheduleEntry[],
) => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  const parsed = employeeScheduleSchema.safeParse(schedules)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, barbershopId: shop.id },
    select: { id: true },
  })

  if (!employee) {
    throw new Error("Funcionário não encontrado.")
  }

  await prisma.$transaction(
    parsed.data.map((schedule) =>
      prisma.employeeSchedule.upsert({
        where: {
          employeeId_weekday: {
            employeeId: employee.id,
            weekday: schedule.weekday,
          },
        },
        create: {
          employeeId: employee.id,
          weekday: schedule.weekday,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isDayOff: schedule.isDayOff,
        },
        update: {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isDayOff: schedule.isDayOff,
        },
      }),
    ),
  )

  revalidateShop(shop)
}
