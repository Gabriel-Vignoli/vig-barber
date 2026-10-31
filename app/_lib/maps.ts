// Google Maps links built from the shop location. The embed uses the keyless
// "output=embed" URL, so no API key or billing account is needed.

export type ShopLocation = {
  address: string
  city: string | null
  latitude: number | null
  longitude: number | null
}

const hasCoordinates = (shop: ShopLocation) =>
  typeof shop.latitude === "number" &&
  typeof shop.longitude === "number" &&
  Number.isFinite(shop.latitude) &&
  Number.isFinite(shop.longitude)

// Exact coordinates win; otherwise the address plus the city (when the
// address does not already mention it)
export const getMapsQuery = (shop: ShopLocation): string => {
  if (hasCoordinates(shop)) {
    return `${shop.latitude},${shop.longitude}`
  }

  const address = shop.address.trim()
  const city = shop.city?.trim() ?? ""

  if (!city || address.toLowerCase().includes(city.toLowerCase())) {
    return address
  }

  return address ? `${address}, ${city}` : city
}

export const getMapsEmbedUrl = (shop: ShopLocation): string =>
  `https://www.google.com/maps?q=${encodeURIComponent(getMapsQuery(shop))}&z=16&output=embed`

export const getMapsSearchUrl = (shop: ShopLocation): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getMapsQuery(shop))}`
