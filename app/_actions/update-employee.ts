"use server"

import bcrypt from "bcryptjs"
import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import { updateEmployeeSchema } from "../_lib/validations/employee"

export const updateEmployee = async (
  slug: string,
  employeeId: string,
  input: {
    bio?: string
    imageUrl?: string
    phone?: string
    password?: string
  },
) => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  const parsed = updateEmployeeSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, barbershopId: shop.id },
    select: { id: true, userId: true },
  })

  if (!employee) {
    throw new Error("Funcionário não encontrado.")
  }

  const { count } = await prisma.employee.updateMany({
    where: { id: employee.id, barbershopId: shop.id },
    data: {
      bio: parsed.data.bio || null,
      imageUrl: parsed.data.imageUrl || null,
      phone: parsed.data.phone || null,
    },
  })

  if (count === 0) {
    throw new Error("Funcionário não encontrado.")
  }

  // TODO(Phase 4b): the account is global, so decide whether a shop admin
  // may still reset a staff member's password
  if (parsed.data.password) {
    const hashedPassword = await bcrypt.hash(parsed.data.password, 10)

    await prisma.user.update({
      where: { id: employee.userId },
      data: { password: hashedPassword },
    })
  }

  revalidateShop(shop)
}
