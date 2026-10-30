import { prisma } from "../_lib/prisma"

// Every service of the shop (id + name), for the admin's service pickers
export const getAllServices = async (shopId: string) => {
  const services = await prisma.barbershopService.findMany({
    where: { barbershopId: shopId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return services
}
