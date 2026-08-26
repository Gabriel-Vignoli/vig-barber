"use client"

import { SmartphoneIcon } from "lucide-react"
import { Button } from "./ui/button"
import { toast } from "sonner"

interface PhoneItemProps {
  phone: string
}

const PhoneItem = ({ phone }: PhoneItemProps) => {
  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone)
    toast.success("Número copiado para a área de transferência!")
  }

  return (
    <div className="flex justify-between md:space-y-3">
      <div className="flex items-center gap-2">
        <SmartphoneIcon />
        <p className="text-sm md:text-base">{phone}</p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="cursor-pointer md:px-3 md:py-2 md:text-sm"
        onClick={() => handleCopyPhone(phone)}
      >
        Copiar
      </Button>
    </div>
  )
}

export default PhoneItem
