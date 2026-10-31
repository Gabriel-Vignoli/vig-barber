import Image from "next/image"
import Link from "next/link"
import { ChevronRightIcon, MapPinIcon, StoreIcon } from "lucide-react"
import type { ShopSearchResult as ShopSearchResultData } from "../_data/search-shops"
import { Card, CardContent } from "./ui/card"

interface ShopSearchResultProps {
  shop: ShopSearchResultData
}

// One shop in the landing page finder, linking to its booking home
const ShopSearchResult = ({ shop }: ShopSearchResultProps) => {
  const location = [shop.address, shop.city].filter(Boolean).join(" · ")

  return (
    <Link href={`/b/${shop.slug}`} className="group block h-full">
      <Card className="group-hover:bg-muted/50 h-full gap-0 overflow-hidden p-0 transition-colors">
        <div className="bg-muted relative h-28 w-full lg:h-32">
          {shop.bannerUrl ? (
            <Image
              src={shop.bannerUrl}
              alt={`Banner da ${shop.name}`}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="from-primary/20 to-muted h-full w-full bg-linear-to-br" />
          )}
        </div>

        <CardContent className="flex items-center gap-3 p-4">
          <div className="bg-primary/10 relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border">
            {shop.logoUrl ? (
              <Image
                src={shop.logoUrl}
                alt={`Logo da ${shop.name}`}
                fill
                sizes="44px"
                className="object-cover"
              />
            ) : (
              <StoreIcon size={20} className="text-primary" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{shop.name}</h3>
            {location && (
              <p className="text-muted-foreground flex items-center gap-1 text-sm">
                <MapPinIcon size={14} className="shrink-0" />
                <span className="truncate">{location}</span>
              </p>
            )}
          </div>

          <ChevronRightIcon
            size={18}
            className="text-muted-foreground shrink-0"
          />
        </CardContent>
      </Card>
    </Link>
  )
}

export default ShopSearchResult
