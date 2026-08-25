"use client"

import { Button } from "./ui/button"
import { CalendarIcon } from "lucide-react"
import Link from "next/link"

const BookingsNavLink = () => {
  return (
    <Button
      className="gap-2"
      variant="ghost"
      nativeButton={false}
      render={(buttonProps) => (
        <Link href="/bookings" {...buttonProps}>
          <CalendarIcon size={18} />
          Agendamentos
        </Link>
      )}
    />
  )
}

export default BookingsNavLink
