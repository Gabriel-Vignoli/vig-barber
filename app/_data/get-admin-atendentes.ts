import { prisma } from "../_lib/prisma"

// Atendentes are read from User, so they show up even without an Employee row
export const getAdminAtendentes = async () => {
  const atendentes = await prisma.user.findMany({
    where: { role: "ATENDENTE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
    },
  })

  return { atendentes, totalCount: atendentes.length }
}
