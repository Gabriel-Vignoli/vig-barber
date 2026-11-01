"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import { serviceFormSchema } from "../_lib/validations/service"
import { action, ActionError } from "../_lib/action-result"

export const updateService = action(
  async (
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
      throw new ActionError(parsed.error.issues[0].message)
    }

    const { count } = await prisma.barbershopService.updateMany({
      where: { id: serviceId, barbershopId: shop.id },
      data: parsed.data,
    })

    if (count === 0) {
      throw new ActionError("Serviço não encontrado.")
    }

    revalidateShop(shop)
  },
)
