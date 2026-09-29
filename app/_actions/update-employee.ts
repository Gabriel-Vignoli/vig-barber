"use server"

import bcrypt from "bcryptjs"
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
    password?: string
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

  if (parsed.data.password) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { userId: true },
    })

    if (!employee) {
      throw new Error("Funcionário não encontrado.")
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 10)

    await prisma.user.update({
      where: { id: employee.userId },
      data: { password: hashedPassword },
    })
  }

  revalidatePath("/admin/employees")
  revalidatePath("/")
}
