"use client"

import { useRef } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

const CARD_GAP_PX = 16 // matches gap-4 (4 * 4px)

interface CarouselProps {
  children: React.ReactNode
}

const Carousel = ({ children }: CarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScrollRight = () => {
    const container = scrollRef.current
    if (!container) return

    const firstCard = container.firstElementChild as HTMLElement | null
    const scrollAmount = firstCard ? firstCard.offsetWidth + CARD_GAP_PX : 240

    container.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }

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
        className="flex gap-4 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <button
        onClick={handleScrollLeft}
        aria-label="Ver itens anteriores"
        className="absolute top-1/2 left-0 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/6 md:flex"
      >
        <ChevronLeftIcon size={30} />
      </button>

      <button
        onClick={handleScrollRight}
        aria-label="Ver mais itens"
        className="absolute top-1/2 right-0 hidden h-12 w-12 translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/6 md:flex"
      >
        <ChevronRightIcon size={30} />
      </button>
    </div>
  )
}

export default Carousel
