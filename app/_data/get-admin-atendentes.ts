import { prisma } from "../_lib/prisma"

// Atendentes come from the shop's memberships, so they show up even without
// an Employee row
export const getAdminAtendentes = async (shopId: string) => {
  const memberships = await prisma.membership.findMany({
    where: { barbershopId: shopId, role: "ATENDENTE" },
    orderBy: { createdAt: "desc" },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true,
        },
      },
    },
  })

  const atendentes = memberships.map((membership) => membership.user)

  return { atendentes, totalCount: atendentes.length }
}
