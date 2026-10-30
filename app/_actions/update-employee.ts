"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import { updateEmployeeSchema } from "../_lib/validations/employee"

// Edits the shop's Employee profile only (bio, image, phone). The User
// account is global and may have been attached from another shop, so no User
// field (name, email, password...) is ever written here. Staff reset their
// own password through "Esqueci minha senha".
export const updateEmployee = async (
  slug: string,
  employeeId: string,
  input: {
    bio?: string
    imageUrl?: string
    phone?: string
  },
) => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  // Unknown keys (e.g. a password sent by a tampered client) are stripped
  const parsed = updateEmployeeSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const { count } = await prisma.employee.updateMany({
    where: { id: employeeId, barbershopId: shop.id, isActive: true },
    data: {
      bio: parsed.data.bio || null,
      imageUrl: parsed.data.imageUrl || null,
      phone: parsed.data.phone || null,
    },
  })

  if (count === 0) {
    throw new Error("Funcionário não encontrado.")
  }

  revalidateShop(shop)
}
