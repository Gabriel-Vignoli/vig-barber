"use client"

import Link from "next/link"
import { Button } from "./ui/button"
import { ChevronLeftIcon } from "lucide-react"
import { cn } from "@/app/_lib/utils"

interface BackButtonProps {
  href: string
  className?: string
}

const BackButton = ({ href, className }: BackButtonProps) => {
  return (
    <Button
      size="icon"
      variant="default"
      className={cn("absolute cursor-pointer rounded-full", className)}
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
