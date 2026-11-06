"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CookieIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import {
  dismissCookieNotice,
  isCookieNoticeDismissed,
} from "../_lib/cookie-notice"

const CookieNotice = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(!isCookieNoticeDismissed())
  }, [])

  const handleDismiss = () => {
    dismissCookieNotice()
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
              Usamos apenas cookies essenciais, que mantêm você conectado. Não
              usamos cookies de publicidade ou rastreamento. Saiba mais na{" "}
              <Link
                href="/privacy-policy"
                className="text-primary underline underline-offset-2"
              >
                política de privacidade
              </Link>
              .
            </p>
          </div>

          <Button
            size="sm"
            className="shrink-0 cursor-pointer"
            onClick={handleDismiss}
          >
            Entendi
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default CookieNotice
