import type { Metadata } from "next"
import { getTenant } from "@/app/_lib/tenant"
import ShopFooter from "@/app/components/shop-footer"

export const generateMetadata = async ({
  params,
}: LayoutProps<"/b/[slug]">): Promise<Metadata> => {
  const { slug } = await params
  const shop = await getTenant(slug)

  return {
    title: {
      default: shop.name,
      template: `%s | ${shop.name}`,
    },
    description: shop.description,
  }
}

// Every page under /b/[slug] belongs to one shop: 404 when it is missing or
// suspended, then show the shop's contact block above the platform footer.
const ShopLayout = async ({ children, params }: LayoutProps<"/b/[slug]">) => {
  const { slug } = await params
  const shop = await getTenant(slug)

  return (
    <>
      {children}
      <ShopFooter shop={shop} />
    </>
  )
}

export default ShopLayout
