"use client"

import { Button } from "./ui/button"
import { MenuIcon } from "lucide-react"
import { Sheet, SheetTrigger } from "./ui/sheet"
import SidebarSheet from "./sidebar-sheet"

const MobileNav = () => {
  return (
    <Sheet>
      <SheetTrigger
        render={(triggerProps) => (
          <Button
            size="icon"
            variant="ghost"
            className="cursor-pointer"
            {...triggerProps}
          >
            <MenuIcon />
          </Button>
        )}
      />
      <SidebarSheet></SidebarSheet>
    </Sheet>
  )
}

export default MobileNav
