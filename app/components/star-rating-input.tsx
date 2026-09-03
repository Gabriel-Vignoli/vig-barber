"use client"

import { useState } from "react"
import { StarIcon } from "lucide-react"

interface StarRatingInputProps {
  value: number
  onChange: (value: number) => void
}

const StarRatingInput = ({ value, onChange }: StarRatingInputProps) => {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hovered ?? value) >= star

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer p-0.5"
          >
            <StarIcon
              size={28}
              className={
                isFilled ? "text-primary fill-primary" : "text-muted-foreground"
              }
            />
          </button>
        )
      })}
    </div>
  )
}

export default StarRatingInput
