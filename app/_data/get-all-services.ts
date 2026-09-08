import { prisma } from "../_lib/prisma"

export const getAllServices = async () => {
  const services = await prisma.barbershopService.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return services
}
