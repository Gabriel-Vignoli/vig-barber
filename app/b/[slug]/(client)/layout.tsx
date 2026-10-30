import { getTenant } from "@/app/_lib/tenant"
import ShopFooter from "@/app/components/shop-footer"

// Client-facing shop pages: the shop's contact block above the platform footer
const ShopClientLayout = async ({
  children,
  params,
}: LayoutProps<"/b/[slug]">) => {
  const { slug } = await params
  const shop = await getTenant(slug)

  return (
    <>
      {children}
      <ShopFooter shop={shop} />
    </>
  )
}

export default ShopClientLayout
