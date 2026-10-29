"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "../_lib/prisma"
import { requireAdmin } from "../_lib/require-admin"
import { revalidateShop } from "../_lib/revalidate"
import {
  updateBarbershopSchema,
  UpdateBarbershopFormValues,
} from "../_lib/validations/barbershop"

export const updateBarbershop = async (input: UpdateBarbershopFormValues) => {
  await requireAdmin()

  // validate again on the server, the client check can be bypassed
  const parsed = updateBarbershopSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const barbershop = await prisma.barbershop.findFirst({
    select: { id: true, slug: true },
  })
  if (!barbershop) {
    throw new Error("Barbearia não encontrada.")
  }

  const { name, description, address, bannerUrl, instagramUrl, phones } =
    parsed.data

  await prisma.barbershop.update({
    where: { id: barbershop.id },
    data: {
      name,
      description,
      address,
      bannerUrl,
      instagramUrl: instagramUrl || null,
      phones,
    },
  })

  // Expires the shop caches (tenant lookup, services, employees) and its pages
  revalidateShop(barbershop)
  revalidatePath("/", "layout")
}
