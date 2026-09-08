"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "./ui/button"

interface AdminPaginationProps {
  currentPage: number
  totalPages: number
}

const AdminPagination = ({ currentPage, totalPages }: AdminPaginationProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/admin/bookings?${params.toString()}`)
  }

  // Build a compact page list: first, last, current, and neighbors — with
  // "…" gaps for anything skipped, so a 40-page list doesn't render 40 buttons.
  const pages: (number | "ellipsis")[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis")
    }
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="cursor-pointer"
        disabled={currentPage === 1}
        onClick={() => goToPage(currentPage - 1)}
      >
        <ChevronLeftIcon size={16} />
      </Button>

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="text-muted-foreground px-2 text-sm"
          >
            …
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="icon"
            className="cursor-pointer"
            onClick={() => goToPage(page)}
          >
            {page}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="icon"
        className="cursor-pointer"
        disabled={currentPage === totalPages}
        onClick={() => goToPage(currentPage + 1)}
      >
        <ChevronRightIcon size={16} />
      </Button>
    </div>
  )
}

export default AdminPagination
