import { getMapsEmbedUrl, type ShopLocation } from "../_lib/maps"
import { cn } from "../_lib/utils"

interface ShopMapProps {
  shop: ShopLocation & { name: string }
  className?: string
}

// Google Maps embed of the shop location (keyless iframe, loaded lazily)
const ShopMap = ({ shop, className }: ShopMapProps) => {
  return (
    <iframe
      src={getMapsEmbedUrl(shop)}
      title={`Mapa da localização de ${shop.name}`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={cn("h-full w-full border-0", className)}
    />
  )
}

export default ShopMap
