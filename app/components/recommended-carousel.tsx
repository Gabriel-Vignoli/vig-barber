"use client"

import { useRef } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import EmployeeItem from "./employee-item"

const CARD_GAP_PX = 20 // matches gap-5 (5 * 4px)

interface RecommendedCarouselProps {
  employees: {
    id: string
    name: string
    imageUrl: string
    averageRating: number | null
    ratingCount: number
  }[]
}

const RecommendedCarousel = ({ employees }: RecommendedCarouselProps) => {
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
        {employees.map((employee) => (
          <EmployeeItem key={employee.id} employee={employee}></EmployeeItem>
        ))}
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
