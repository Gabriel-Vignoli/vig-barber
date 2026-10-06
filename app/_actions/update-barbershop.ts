"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "../_lib/prisma"
import { requireAdmin } from "../_lib/require-admin"
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
    select: { id: true },
  })
  if (!barbershop) {
    throw new Error("Barbearia não encontrada.")
  }

  const { name, description, address, imageUrl, instagramUrl, phones } =
    parsed.data

  await prisma.barbershop.update({
    where: { id: barbershop.id },
    data: {
      name,
      description,
      address,
      imageUrl,
      instagramUrl: instagramUrl || null,
      phones,
    },
  })

  // getCachedBarbershop uses unstable_cache (1h), so expire its tag
  updateTag("barbershop")
  revalidatePath("/", "layout")
}
