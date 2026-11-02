import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CreditCardIcon } from "lucide-react"
import {
  getBillingPath,
  getMembership,
  getSessionUserId,
  getTenant,
  shopHasAccess,
} from "@/app/_lib/tenant"
import { getShopAreaPath } from "@/app/_constants/roles"
import Header from "@/app/components/header"
import { Card, CardContent } from "@/app/components/ui/card"

export const metadata: Metadata = {
  title: "Assinatura pendente",
}

interface BillingBlockedPageProps {
  params: Promise<{ slug: string }>
}

// Where requireShopRole sends the ATENDENTE / EMPLOYEE staff of an unpaid
// shop. Only those staff see it: anyone else goes back to the shop page, the
// shop's ADMIN to the billing page, and staff of a shop that is in good
// standing to their own area.
const BillingBlockedPage = async ({ params }: BillingBlockedPageProps) => {
  const { slug } = await params
  const shop = await getTenant(slug)
  const userId = await getSessionUserId()
  const membership = userId ? await getMembership(shop.id, userId) : null

  if (!membership) {
    redirect(`/b/${slug}`)
  }

  if (shopHasAccess(shop)) {
    redirect(getShopAreaPath(slug, membership.role))
  }

  if (membership.role === "ADMIN") {
    redirect(getBillingPath(slug))
  }

  return (
    <div>
      <Header />

      <div className="mx-auto max-w-xl p-4 lg:p-8">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <div className="bg-destructive/10 mx-auto flex size-12 items-center justify-center rounded-full">
              <CreditCardIcon size={22} className="text-destructive" />
            </div>

            <div className="space-y-2">
              <h1 className="text-lg font-bold lg:text-xl">
                Barbearia com assinatura pendente
              </h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                O acesso da equipe da {shop.name} está pausado até a assinatura
                ser regularizada. Fale com o responsável pela barbearia.
              </p>
            </div>

            <Link
              href="/painel"
              className="text-primary inline-block text-sm font-semibold hover:underline"
            >
              Ver minhas barbearias
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default BillingBlockedPage
