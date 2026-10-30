import { notFound } from "next/navigation"
import { redirectToShopAdmin } from "@/app/_lib/redirect-to-shop-admin"

// The static /admin/login and /admin/atendente routes win over this segment
const LEGACY_SECTIONS = [
  "bookings",
  "services",
  "employees",
  "expenses",
  "barbershop",
]

// Legacy /admin/<section>: redirects to the same section of the admin's shop
// TODO(Phase 8): remove the legacy redirects
const LegacyAdminSectionPage = async ({
  params,
  searchParams,
}: PageProps<"/admin/[section]">) => {
  const { section } = await params

  if (!LEGACY_SECTIONS.includes(section)) {
    notFound()
  }

  return redirectToShopAdmin(section, await searchParams)
}

export default LegacyAdminSectionPage
