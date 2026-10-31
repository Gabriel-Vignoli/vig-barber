import type { Metadata } from "next"
import { getTenant } from "@/app/_lib/tenant"

export const generateMetadata = async ({
  params,
}: LayoutProps<"/b/[slug]">): Promise<Metadata> => {
  const { slug } = await params
  const shop = await getTenant(slug)

  // The banner makes the better link preview; the logo is the fallback
  const previewImage = shop.bannerUrl ?? shop.logoUrl

  return {
    title: {
      default: shop.name,
      template: `%s | ${shop.name}`,
    },
    description: shop.description,
    ...(shop.logoUrl && { icons: { icon: shop.logoUrl } }),
    openGraph: {
      title: shop.name,
      description: shop.description,
      siteName: "Vig Barber",
      locale: "pt_BR",
      type: "website",
      ...(previewImage && { images: [{ url: previewImage, alt: shop.name }] }),
    },
    twitter: {
      card: previewImage ? "summary_large_image" : "summary",
      title: shop.name,
      description: shop.description,
      ...(previewImage && { images: [previewImage] }),
    },
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
