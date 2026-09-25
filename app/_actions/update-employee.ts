"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"
import { updateEmployeeSchema } from "../_lib/validations/employee"

export const updateEmployee = async (
  employeeId: string,
  input: {
    bio?: string
    imageUrl?: string
    phone?: string
  },
) => {
  await requireAdmin()

  const parsed = updateEmployeeSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      bio: parsed.data.bio || null,
      imageUrl: parsed.data.imageUrl || null,
      phone: parsed.data.phone || null,
    },
  })

  revalidatePath("/admin/employees")
  revalidatePath("/")
}
