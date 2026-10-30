import { notFound, redirect } from "next/navigation"
import { prisma } from "./_lib/prisma"
import { getSessionUserId } from "./_lib/tenant"
import { getFirstShopWithRole } from "./_lib/staff-shop"

export default async function Home() {
  const userId = await getSessionUserId()

  // Barbers used to have / as their home: keep sending them to their shop's
  // staff dashboard (307, depends on the user). Admins and atendentes use
  // /painel or their area links. TODO(Phase 7): revisit with the landing page
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
