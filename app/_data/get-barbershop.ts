import { prisma } from "../_lib/prisma"
import { unstable_cache } from "next/cache"

export const getCachedBarbershop = unstable_cache(
  async () => prisma.barbershop.findFirst(),
  ["barbershop"],
  { revalidate: 3600 },
)
