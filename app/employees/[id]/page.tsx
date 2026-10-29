import { notFound, permanentRedirect } from "next/navigation"
import { prisma } from "@/app/_lib/prisma"

interface LegacyEmployeePageProps {
  params: Promise<{ id: string }>
}

// Legacy URL from the single-shop era: 308 to the employee's shop
// TODO(Phase 8): remove the legacy redirects
const LegacyEmployeePage = async ({ params }: LegacyEmployeePageProps) => {
  const { id } = await params

  const employee = await prisma.employee.findUnique({
    where: { id },
    select: { barbershop: { select: { slug: true } } },
  })

  if (!employee) {
    notFound()
  }

  permanentRedirect(`/b/${employee.barbershop.slug}/employees/${id}`)
}

export default LegacyEmployeePage
