"use server"

import { prisma } from "../_lib/prisma"
import { Weekday } from "@prisma/client"

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

export const getEmployeeSchedule = async (
  employeeId: string,
  date: Date,
): Promise<EmployeeScheduleResult> => {
  const weekday = WEEKDAY_BY_JS_DAY[date.getDay()]

  return prisma.employeeSchedule.findUnique({
    where: {
      employeeId_weekday: {
        employeeId,
        weekday,
      },
    },
  })
}
