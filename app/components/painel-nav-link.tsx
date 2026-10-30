"use client"

import Link from "next/link"
import { LayoutGridIcon } from "lucide-react"
import { Button } from "./ui/button"

// Shown only to staff (see useHasStaffMembership)
const PainelNavLink = () => {
  return (
    <Button
      className="gap-2"
      variant="ghost"
      nativeButton={false}
      render={(buttonProps) => (
        <Link href="/painel" {...buttonProps}>
          <LayoutGridIcon size={18} />
          Minhas barbearias
        </Link>
      )}
    />
  )
}

export default PainelNavLink
