"use client"

import { Button } from "./ui/button"

interface ViewLocationButtonProps {
  href: string
}

const ViewLocationButton = ({ href }: ViewLocationButtonProps) => {
  return (
    <Button
      className="cursor-pointer"
      render={(buttonProps) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          {...buttonProps}
        />
      )}
    >
      Ver Localização
    </Button>
  )
}

export default ViewLocationButton
