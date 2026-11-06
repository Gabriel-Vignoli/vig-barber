import { getMapsEmbedUrl, type ShopLocation } from "../_lib/maps"
import ShopMapEmbed from "./shop-map-embed"

interface ShopMapProps {
  shop: ShopLocation & { name: string }
  className?: string
}

// Google Maps embed of the shop location (keyless iframe, loaded on click).
// Only strings reach the client part, so server pages can pass a full shop row.
const ShopMap = ({ shop, className }: ShopMapProps) => {
  return (
    <ShopMapEmbed
      src={getMapsEmbedUrl(shop)}
      title={`Mapa da localização de ${shop.name}`}
      className={className}
    />
  )
}

export default ShopMap
