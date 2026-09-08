"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "../_lib/require-admin"
import { prisma } from "../_lib/prisma"
import { serviceFormSchema } from "../_lib/validations/service"

export const createService = async (input: {
  name: string
  description: string
  price: number
  durationInMinutes: number
  imageUrl: string
}) => {
  await requireAdmin()

  const parsed = serviceFormSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const barbershop = await prisma.barbershop.findFirst()

  if (!barbershop) {
    throw new Error("Nenhuma barbearia cadastrada.")
  }

  await prisma.barbershopService.create({
    data: {
      ...parsed.data,
      barbershopId: barbershop.id,
    },
  })

  revalidatePath("/admin/services")
  revalidatePath("/")
}
