import { cache } from "react"
import { unstable_cache } from "next/cache"
import { prisma } from "../_lib/prisma"
import { shopTag } from "../_lib/tenant"

// Services change rarely, so cache them per shop. The select has no Date
// fields and price becomes a number inside the cache, so nothing needs
// rehydrating after the JSON round trip.
export const getShopServices = cache((barbershopId: string) =>
  unstable_cache(
    async () => {
      const services = await prisma.barbershopService.findMany({
        where: { barbershopId },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
          durationInMinutes: true,
        },
      })

      return services.map((service) => ({
        ...service,
        price: Number(service.price),
      }))
    },
    ["shop-services", barbershopId],
    { tags: [shopTag(barbershopId)], revalidate: 3600 },
  )(),
)
