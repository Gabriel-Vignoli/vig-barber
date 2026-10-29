import { notFound, permanentRedirect } from "next/navigation"
import { prisma } from "@/app/_lib/prisma"

interface LegacyServicePageProps {
  params: Promise<{ id: string }>
}

// Legacy URL from the single-shop era: 308 to the service's shop
// TODO(Phase 8): remove the legacy redirects
const LegacyServicePage = async ({ params }: LegacyServicePageProps) => {
  const { id } = await params

  const service = await prisma.barbershopService.findUnique({
    where: { id },
    select: { barbershop: { select: { slug: true } } },
  })

  if (!service) {
    notFound()
  }

  permanentRedirect(`/b/${service.barbershop.slug}/services/${id}`)
}

export default LegacyServicePage
