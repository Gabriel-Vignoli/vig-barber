"use client"

import { useRef } from "react"
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"

const CARD_GAP_PX = 20 // matches gap-5 (5 * 4px)

const BlankRecommendedCard = () => {
  return (
    <Card className="w-56 shrink-0 p-0 md:w-72">
      <CardContent className="p-0">
        <div className="relative h-36 w-full md:h-52 lg:h-64">
          <div className="bg-secondary h-full w-full rounded-xl" />

          <Badge
            className="bg-secondary/80 absolute top-2 right-2 space-x-1"
            variant="secondary"
          >
            <StarIcon
              size={12}
              className="fill-primary text-primary"
            ></StarIcon>
            <p className="text-xs font-semibold">5,0</p>
          </Badge>
        </div>
        <div className="px-2 py-2 md:py-3">
          <h3 className="bg-secondary h-4 w-3/4 rounded" />
          <p className="bg-secondary mt-2 h-3 w-full rounded" />
          <Button
            disabled
            variant="outline"
            className="mt-2 w-full py-3 text-sm md:mt-3 md:py-4 md:text-base"
          >
            Reservar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const RecommendedCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Drags the row over by exactly one card's width, using the first card's
  // real rendered width so this stays correct if the card size changes.
  const handleScrollRight = () => {
    const container = scrollRef.current
    if (!container) return

    const firstCard = container.firstElementChild as HTMLElement | null
    const scrollAmount = firstCard ? firstCard.offsetWidth + CARD_GAP_PX : 240

    container.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }

  // Same logic as scroll right, but moves the row back by one card's width.
  const handleScrollLeft = () => {
    const container = scrollRef.current
    if (!container) return

    const firstCard = container.firstElementChild as HTMLElement | null
    const scrollAmount = firstCard ? firstCard.offsetWidth + CARD_GAP_PX : 240

    container.scrollBy({ left: -scrollAmount, behavior: "smooth" })
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
      >
        <BlankRecommendedCard />
        <BlankRecommendedCard />
        <BlankRecommendedCard />
      </div>

      <button
        onClick={handleScrollLeft}
        aria-label="Ver recomendações anteriores"
        className="absolute top-1/2 left-0 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/6 md:h-12 md:w-12"
      >
        <ChevronLeftIcon size={20} className="md:hidden" />
        <ChevronLeftIcon size={30} className="hidden md:block" />
      </button>

      <button
        onClick={handleScrollRight}
        aria-label="Ver mais recomendações"
        className="absolute top-1/2 right-0 flex h-9 w-9 translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/6 md:h-12 md:w-12"
      >
        <ChevronRightIcon size={20} className="md:hidden" />
        <ChevronRightIcon size={30} className="hidden md:block" />
      </button>
    </div>
  )
}

export default RecommendedCarousel
