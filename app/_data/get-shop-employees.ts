import { cache } from "react"
import { unstable_cache } from "next/cache"
import { prisma } from "../_lib/prisma"
import { shopTag } from "../_lib/tenant"

// Active employees + their ratings, cached per shop for a short window since
// new reviews come in regularly. Returns plain JSON-safe values only.
export const getShopEmployees = cache((barbershopId: string) =>
  unstable_cache(
    async () => {
      const employees = await prisma.employee.findMany({
        where: { barbershopId, isActive: true },
        select: {
          id: true,
          imageUrl: true,
          user: { select: { name: true, image: true } },
          reviews: { select: { rating: true } },
        },
      })

      return employees
        .map((employee) => {
          const ratingCount = employee.reviews.length
          const averageRating =
            ratingCount > 0
              ? employee.reviews.reduce(
                  (acc, review) => acc + review.rating,
                  0,
                ) / ratingCount
              : null

          return {
            id: employee.id,
            name: employee.user.name ?? "Funcionário",
            imageUrl: employee.imageUrl ?? employee.user.image ?? null,
            averageRating,
            ratingCount,
          }
        })
        .sort(
          (a, b) =>
            b.ratingCount - a.ratingCount ||
            (b.averageRating ?? 0) - (a.averageRating ?? 0) ||
            a.name.localeCompare(b.name, "pt-BR"),
        )
    },
    ["shop-active-employees", barbershopId],
    { tags: [shopTag(barbershopId)], revalidate: 300 },
  )(),
)
