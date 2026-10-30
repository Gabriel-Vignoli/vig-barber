import { z } from "zod"
import { Weekday } from "@/app/generated/prisma/enums"

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido. Use o formato HH:mm.")

export const employeeScheduleEntrySchema = z
  .object({
    weekday: z.enum(Weekday, "Dia da semana inválido."),
    startTime: timeSchema,
    endTime: timeSchema,
    isDayOff: z.boolean(),
  })
  // "HH:mm" strings compare correctly as text
  .refine((entry) => entry.isDayOff || entry.startTime < entry.endTime, {
    message: "O horário de início deve ser antes do horário de término.",
    path: ["endTime"],
  })

export const employeeScheduleSchema = z
  .array(employeeScheduleEntrySchema)
  .refine(
    (entries) =>
      new Set(entries.map((entry) => entry.weekday)).size === entries.length,
    "Cada dia da semana só pode aparecer uma vez.",
  )

export type EmployeeScheduleEntry = z.infer<typeof employeeScheduleEntrySchema>
