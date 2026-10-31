"use server"

import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import {
  parseCoordinate,
  updateBarbershopSchema,
  UpdateBarbershopFormValues,
} from "../_lib/validations/barbershop"

export const updateBarbershop = async (
  slug: string,
  input: UpdateBarbershopFormValues,
) => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

  // validate again on the server, the client check can be bypassed
  const parsed = updateBarbershopSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const {
    name,
    description,
    address,
    city,
    latitude,
    longitude,
    logoUrl,
    bannerUrl,
    instagramUrl,
    phones,
  } = parsed.data

  // shop.id comes from the membership check, never from the client. The
  // logo/banner URLs come from UploadThing (or a pasted URL) and are only
  // saved here, never by the upload route itself.
  const { count } = await prisma.barbershop.updateMany({
    where: { id: shop.id },
    data: {
      name,
      description,
      address,
      city,
      latitude: parseCoordinate(latitude),
      longitude: parseCoordinate(longitude),
      logoUrl: logoUrl || null,
      bannerUrl,
      instagramUrl: instagramUrl || null,
      phones,
    },
  })

  if (count === 0) {
    throw new Error("Barbearia não encontrada.")
  }

  // Expires the shop caches (tenant lookup, services, employees) and its pages
  revalidateShop(shop)
}
