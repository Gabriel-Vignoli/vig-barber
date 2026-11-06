"use client"

import { useState } from "react"
import { MapPinIcon } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "../_lib/utils"

interface ShopMapEmbedProps {
  src: string
  title: string
  className?: string
}

// The iframe only exists after the click: opening it sends the visitor's IP to
// Google and lets Google set its own cookies, so that has to be their choice.
const ShopMapEmbed = ({ src, title, className }: ShopMapEmbedProps) => {
  const [isLoaded, setIsLoaded] = useState(false)

  if (isLoaded) {
    return (
      <iframe
        src={src}
        title={title}
        referrerPolicy="no-referrer-when-downgrade"
        className={cn("h-full w-full border-0", className)}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center",
        className,
      )}
    >
      <p className="text-muted-foreground text-xs">
        O mapa é fornecido pelo Google, que recebe seu IP e pode definir
        cookies.
      </p>
      <Button
        size="sm"
        variant="outline"
        className="cursor-pointer"
        onClick={() => setIsLoaded(true)}
      >
        <MapPinIcon size={14} />
        Carregar mapa
      </Button>
    </div>
  )
}

export default ShopMapEmbed
