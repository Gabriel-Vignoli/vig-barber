"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"
import { serviceFormSchema } from "../_lib/validations/service"

export const updateService = async (
  serviceId: string,
  input: {
    name: string
    description: string
    price: number
    durationInMinutes: number
    imageUrl: string
  },
) => {
  await requireAdmin()

  const parsed = serviceFormSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  await prisma.barbershopService.update({
    where: { id: serviceId },
    data: parsed.data,
  })

  revalidatePath("/admin/services")
  revalidatePath("/")
}
