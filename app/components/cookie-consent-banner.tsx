"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CookieIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { getCookieConsent, setCookieConsent } from "../_lib/cookie-consent"

const CookieConsentBanner = () => {
  const [visible, setVisible] = useState<boolean | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(getCookieConsent() === null)
  }, [])

  const handleAccept = () => {
    setCookieConsent("accepted")
    setVisible(false)
  }

  const handleReject = () => {
    setCookieConsent("rejected")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <Card className="mx-auto max-w-3xl border-2 shadow-xl">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between lg:p-6">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full">
              <CookieIcon size={18} className="text-primary" />
            </div>
            <p className="text-sm lg:text-base">
              Usamos cookies para melhorar sua experiência e manter você
              conectado. Ao continuar navegando, você concorda com nossa{" "}
              <Link
                href="/privacy-policy"
                className="text-primary underline underline-offset-2"
              >
                política de privacidade
              </Link>
              .
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={handleReject}
            >
              Recusar
            </Button>
            <Button size="sm" className="cursor-pointer" onClick={handleAccept}>
              Aceitar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CookieConsentBanner
