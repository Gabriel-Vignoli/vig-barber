"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "./ui/button"

const FILTERS = [
  { value: "all", label: "Todos" },
  { value: "upcoming", label: "Próximos" },
  { value: "past", label: "Finalizados" },
  { value: "cancelled", label: "Cancelados" },
] as const

const AdminBookingFilters = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeFilter = searchParams.get("filter") ?? "all"

  const handleFilterClick = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("filter", filter)
    params.set("page", "1")
    router.push(`/admin/bookings?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => (
        <Button
          key={filter.value}
          size="sm"
          variant={activeFilter === filter.value ? "default" : "outline"}
          className="cursor-pointer lg:text-base"
          onClick={() => handleFilterClick(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  )
}

export default AdminBookingFilters
