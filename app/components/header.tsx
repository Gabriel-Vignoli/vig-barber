"use client"

import Image from "next/image"
import { Card, CardContent } from "./ui/card"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import DesktopProfileMenu from "./desktop-profile-menu"
import MobileNav from "./mobile-nav"
import BookingsNavLink from "./bookings-nav-link"

const Header = () => {
  const { data } = useSession()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isEmployee = (data?.user as any)?.role === "EMPLOYEE"
  // Inside /b/[slug] the logo goes back to that shop's home
  const { slug } = useParams<{ slug?: string }>()
  const homeHref = slug ? `/b/${slug}` : "/"

  return (
    <Card className="bg-background rounded-none">
      <CardContent className="flex items-center justify-between md:px-8 md:py-2 lg:px-16 xl:px-32">
        <Link href={homeHref}>
          <Image
            src="/logo.png"
            alt="Vig Barber"
            width={120}
            height={29}
            priority
            className="md:h-auto md:w-36"
          />
        </Link>

        <div className="md:hidden">
          <MobileNav></MobileNav>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          {!isEmployee && <BookingsNavLink></BookingsNavLink>}
          <DesktopProfileMenu></DesktopProfileMenu>
        </div>
      </CardContent>
    </Card>
  )
}

export default Header
