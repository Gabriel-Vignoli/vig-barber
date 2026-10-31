"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "../_lib/prisma"
import { assertPlatformAdmin } from "../_lib/platform-admin"
import { revalidateShop } from "../_lib/revalidate"

const updateShopStatusSchema = z.object({
  shopId: z.string().min(1, "Barbearia inválida."),
  status: z.enum(["ACTIVE", "SUSPENDED"], { message: "Status inválido." }),
})

// Platform only: a suspended shop 404s everywhere (getTenant) and its staff
// lose access to it, without deleting any data
export const updateShopStatus = async (
  shopId: string,
  status: "ACTIVE" | "SUSPENDED",
) => {
  await assertPlatformAdmin()

  const parsed = updateShopStatusSchema.safeParse({ shopId, status })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const shop = await prisma.barbershop.findUnique({
    where: { id: parsed.data.shopId },
    select: { id: true, slug: true },
  })

  if (!shop) {
    throw new Error("Barbearia não encontrada.")
  }

  await prisma.barbershop.update({
    where: { id: shop.id },
    data: { status: parsed.data.status },
  })

  revalidateShop(shop)
  revalidatePath("/platform")
}
