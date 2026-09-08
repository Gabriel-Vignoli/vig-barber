"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"
import { Weekday } from "@prisma/client"

interface ScheduleInput {
  weekday: Weekday
  startTime: string
  endTime: string
  isDayOff: boolean
}

export const updateEmployeeSchedule = async (
  employeeId: string,
  schedules: ScheduleInput[],
) => {
  await requireAdmin()

  await prisma.$transaction(
    schedules.map((schedule) =>
      prisma.employeeSchedule.upsert({
        where: {
          employeeId_weekday: { employeeId, weekday: schedule.weekday },
        },
        create: { employeeId, ...schedule },
        update: {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isDayOff: schedule.isDayOff,
        },
      }),
    ),
  )

  revalidatePath("/admin/employees")
  revalidatePath("/")
}
