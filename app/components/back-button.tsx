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
      variant="default"
      className="absolute top-3 left-3 cursor-pointer rounded-full lg:hidden"
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
