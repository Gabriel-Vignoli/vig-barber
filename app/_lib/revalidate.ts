import { revalidatePath, revalidateTag, updateTag } from "next/cache"
import { shopSlugTag, shopTag } from "./tenant"

// Call from Server Actions only (updateTag is not allowed in route handlers).
// Expires every cached read of this shop and refreshes all its pages.
// Pass previousSlug when the slug changed so the old URL stops resolving.
export const revalidateShop = (
  shop: { id: string; slug: string },
  options: { previousSlug?: string } = {},
) => {
  updateTag(shopTag(shop.id))
  updateTag(shopSlugTag(shop.slug))
  revalidatePath(`/b/${shop.slug}`, "layout")

  if (options.previousSlug && options.previousSlug !== shop.slug) {
    updateTag(shopSlugTag(options.previousSlug))
    revalidatePath(`/b/${options.previousSlug}`, "layout")
  }
}

// The route-handler version of revalidateShop (the Stripe webhook), where
// updateTag is not allowed. { expire: 0 } expires the tags right away instead
// of serving stale data once, so the billing gate opens on the next request.
export const expireShopCache = (shop: { id: string; slug: string }) => {
  revalidateTag(shopTag(shop.id), { expire: 0 })
  revalidateTag(shopSlugTag(shop.slug), { expire: 0 })
  revalidatePath(`/b/${shop.slug}`, "layout")
}
