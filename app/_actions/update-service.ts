"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import { serviceFormSchema } from "../_lib/validations/service"

export const updateService = async (
  slug: string,
  serviceId: string,
  input: {
    name: string
    description: string
    price: number
    durationInMinutes: number
    imageUrl: string
  },
) => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  const parsed = serviceFormSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const { count } = await prisma.barbershopService.updateMany({
    where: { id: serviceId, barbershopId: shop.id },
    data: parsed.data,
  })

  if (count === 0) {
    throw new Error("Serviço não encontrado.")
  }

  revalidateShop(shop)
}
