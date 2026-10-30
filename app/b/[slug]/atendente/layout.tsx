import { requireShopRole } from "@/app/_lib/tenant"
import { getUserName } from "@/app/_data/get-user-name"
import AtendenteHeader from "@/app/components/atendente-header"

const AtendenteLayout = async ({
  children,
  params,
}: LayoutProps<"/b/[slug]/atendente">) => {
  const { slug } = await params
  const { userId } = await requireShopRole(slug, ["ATENDENTE", "ADMIN"])
  const atendenteName = await getUserName(userId)

  return (
    <>
      <AtendenteHeader
        atendenteName={atendenteName ?? "Atendente"}
        slug={slug}
      />
      {children}
    </>
  )
}

export default AtendenteLayout
