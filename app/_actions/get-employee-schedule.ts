"use server"

import { prisma } from "../_lib/prisma"
import { getActiveShopOrThrow } from "../_lib/tenant"
import { Weekday } from "@/app/generated/prisma/enums"

const WEEKDAY_BY_JS_DAY: Weekday[] = [
  Weekday.SUNDAY,
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
]

export type EmployeeScheduleResult = {
  startTime: string
  endTime: string
  isDayOff: boolean
} | null

// Public: the employee must be active and belong to the shop
export const getEmployeeSchedule = async (
  slug: string,
  employeeId: string,
  date: Date,
): Promise<EmployeeScheduleResult> => {
  const shop = await getActiveShopOrThrow(slug)
  const weekday = WEEKDAY_BY_JS_DAY[date.getDay()]

  return prisma.employeeSchedule.findFirst({
    where: {
      employeeId,
      weekday,
      employee: { barbershopId: shop.id, isActive: true },
    },
    select: { startTime: true, endTime: true, isDayOff: true },
  })
}
