"use client"

import { MessageCircleIcon } from "lucide-react"
import { Button } from "./ui/button"

interface PhoneItemProps {
  phone: string
}

const buildWhatsAppLink = (phone: string) => {
  const digitsOnly = phone.replace(/\D/g, "")
  // Brazilian numbers stored without country code — prepend 55 for wa.me
  const fullNumber = digitsOnly.startsWith("55")
    ? digitsOnly
    : `55${digitsOnly}`

  return `https://wa.me/${fullNumber}`
}

const PhoneItem = ({ phone }: PhoneItemProps) => {
  return (
    <div className="flex justify-between md:space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircleIcon />
        <p className="text-sm md:text-base">{phone}</p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="cursor-pointer md:px-3 md:py-2 md:text-sm"
        nativeButton={false}
        render={(buttonProps) => (
          <a
            href={buildWhatsAppLink(phone)}
            target="_blank"
            rel="noopener noreferrer"
            {...buttonProps}
          />
        )}
      >
        Conversar
      </Button>
    </div>
  )
}

export default PhoneItem
