"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "../_lib/prisma"
import { assertPlatformAdmin } from "../_lib/platform-admin"
import { createInvitation } from "../_lib/invitation"
import { revalidateShop } from "../_lib/revalidate"
import { createShopSchema } from "../_lib/validations/platform"

const SLUG_TAKEN = "Este endereço já está em uso. Escolha outro."

// Platform only: creates a shop and invites its owner as ADMIN. The owner
// always goes through the invitation (even with an existing account), so the
// platform never sets anyone's password.
export const createShop = async (input: {
  name: string
  slug: string
  address: string
  city: string
  phone: string
  ownerEmail: string
}): Promise<{ slug: string; inviteSent: boolean }> => {
  const { userId } = await assertPlatformAdmin()

  const parsed = createShopSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const { name, slug, address, city, phone, ownerEmail } = parsed.data

  const existing = await prisma.barbershop.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (existing) {
    throw new Error(SLUG_TAKEN)
  }

  let shop: { id: string; slug: string; name: string }
  try {
    shop = await prisma.barbershop.create({
      data: {
        name,
        slug,
        address,
        city,
        phones: phone ? [phone] : [],
        description: "",
      },
      select: { id: true, slug: true, name: true },
    })
  } catch (error) {
    // Two requests racing for the same slug
    if ((error as { code?: string } | null)?.code === "P2002") {
      throw new Error(SLUG_TAKEN)
    }
    throw error
  }

  const inviteSent = await createInvitation({
    shop,
    email: ownerEmail,
    role: "ADMIN",
    invitedById: userId,
  })

  revalidateShop(shop)
  revalidatePath("/platform")

  return { slug: shop.slug, inviteSent }
}
