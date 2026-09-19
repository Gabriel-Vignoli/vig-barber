"use client"

import Link from "next/link"
import { Button } from "./ui/button"
import { ChevronLeftIcon } from "lucide-react"

interface BackButtonProps {
  href: string
}

const BackButton = ({ href }: BackButtonProps) => {
  return (
    <Button
      size="icon"
      variant="secondary"
      className="absolute top-3 left-3 cursor-pointer lg:hidden"
      nativeButton={false}
      render={(buttonProps) => (
        <Link href={href} {...buttonProps}>
          <ChevronLeftIcon />
        </Link>
      )}
    />
  )
}

export default BackButton
