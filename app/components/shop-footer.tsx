import { MapPinIcon } from "lucide-react"
import Link from "next/link"
import PhoneItem from "./phone-item"
import { InstagramIcon } from "./footer"

interface ShopFooterProps {
  shop: {
    name: string
    address: string
    instagramUrl: string | null
    phones: string[]
  }
}

// Shop contact block rendered by app/b/[slug]/layout.tsx, right above the
// platform footer from the root layout
const ShopFooter = ({ shop }: ShopFooterProps) => {
  return (
    <section className="space-y-3 border-t px-6 pt-5 pb-6 md:px-16 md:pt-8 md:pb-8 lg:px-32">
      <h3 className="text-sm font-bold md:text-base">{shop.name}</h3>

      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 md:text-base">
          <MapPinIcon size={18} className="text-primary shrink-0" />
          <span>{shop.address}</span>
        </div>

        {shop.instagramUrl && (
          <Link
            href={shop.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground flex items-center gap-2 text-sm text-gray-400 transition-colors md:text-base"
          >
            <InstagramIcon size={18} className="shrink-0" />
            <span>Instagram</span>
          </Link>
        )}
      </div>

      {shop.phones.length > 0 && (
        <div className="max-w-xs space-y-2 md:max-w-sm">
          {shop.phones.map((phone, index) => (
            <PhoneItem key={`${phone}-${index}`} phone={phone} />
          ))}
        </div>
      )}
    </section>
  )
}

export default ShopFooter
