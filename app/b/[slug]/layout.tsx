import type { Metadata } from "next"
import { getTenant } from "@/app/_lib/tenant"

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
// suspended. The client pages add the shop footer in (client)/layout.tsx.
const ShopLayout = async ({ children, params }: LayoutProps<"/b/[slug]">) => {
  const { slug } = await params
  await getTenant(slug)

  return children
}

export default ShopLayout
