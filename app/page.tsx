import { notFound, redirect } from "next/navigation"
import { prisma } from "./_lib/prisma"
import { getSessionUserId } from "./_lib/tenant"
import { getFirstShopWithRole } from "./_lib/staff-shop"

export default async function Home() {
  const userId = await getSessionUserId()

  // Barbers land on their shop's staff dashboard (307, depends on the user)
  // TODO(Phase 4c): replaced by /painel
  if (userId) {
    const staffShop = await getFirstShopWithRole(userId, ["EMPLOYEE"])

    if (staffShop) {
      redirect(`/b/${staffShop.slug}/staff`)
    }
  }

  // TODO(Phase 7): replace with the landing page + shop finder. Until then,
  // send everyone else to the oldest active shop.
  const shop = await prisma.barbershop.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: { slug: true },
  })

  if (!shop) {
    notFound()
  }

  redirect(`/b/${shop.slug}`)
}
