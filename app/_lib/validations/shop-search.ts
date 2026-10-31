import { z } from "zod"

export const SHOP_SEARCH_MAX_LENGTH = 80

// The ?q= of the shop finder: trimmed, capped, and empty when missing. An
// array (?q=a&q=b) keeps only the first value.
export const shopSearchQuerySchema = z.preprocess(
  (value) => (Array.isArray(value) ? value[0] : value),
  z
    .string()
    .trim()
    .transform((value) => value.slice(0, SHOP_SEARCH_MAX_LENGTH))
    .catch(""),
)

export const parseShopSearchQuery = (value: unknown): string => {
  const result = shopSearchQuerySchema.safeParse(value)

  return result.success ? result.data : ""
}
