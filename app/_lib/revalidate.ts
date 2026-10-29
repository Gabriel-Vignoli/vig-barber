import { revalidatePath, updateTag } from "next/cache"
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
