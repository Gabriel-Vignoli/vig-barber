import type { Metadata } from "next"
import Link from "next/link"
import { requirePlatformAdmin } from "../_lib/platform-admin"
import { getPlatformShops } from "../_data/get-platform-shops"
import Header from "../components/header"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import PlatformCreateShopDialog from "../components/platform-create-shop-dialog"
import PlatformInviteMemberDialog from "../components/platform-invite-member-dialog"
import PlatformShopStatusButton from "../components/platform-shop-status-button"

export const metadata: Metadata = {
  title: "Plataforma",
  robots: { index: false, follow: false },
}

const PLAN_LABELS = {
  TRIAL: "Teste",
  BASIC: "Básico",
  PRO: "Pro",
} as const

// Platform super admin: every shop, create, suspend/reactivate and invite
const PlatformPage = async () => {
  await requirePlatformAdmin()

  const shops = await getPlatformShops()

  return (
    <div>
      <Header />

      <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold lg:text-2xl xl:text-3xl">
              Plataforma
            </h1>
            <p className="text-muted-foreground text-sm xl:text-base">
              {shops.length} barbearia{shops.length !== 1 ? "s" : ""}
            </p>
          </div>
          <PlatformCreateShopDialog />
        </div>

        {shops.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Nenhuma barbearia cadastrada.
          </p>
        ) : (
          <ul className="space-y-3">
            {shops.map((shop) => {
              const members = shop._count.memberships
              const pendingInvites = shop._count.invitations

              return (
                <li key={shop.id}>
                  <Card>
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold">{shop.name}</p>
                          <Badge
                            variant={
                              shop.status === "ACTIVE"
                                ? "success"
                                : "destructive"
                            }
                          >
                            {shop.status === "ACTIVE" ? "Ativa" : "Suspensa"}
                          </Badge>
                          <Badge variant="secondary">
                            {PLAN_LABELS[shop.plan]}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground truncate text-sm">
                          {shop.status === "ACTIVE" ? (
                            <Link
                              href={`/b/${shop.slug}`}
                              className="hover:underline"
                            >
                              /b/{shop.slug}
                            </Link>
                          ) : (
                            <span>/b/{shop.slug}</span>
                          )}
                          {shop.city && ` • ${shop.city}`}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {members} membro{members !== 1 ? "s" : ""}
                          {pendingInvites > 0 &&
                            ` • ${pendingInvites} convite${pendingInvites !== 1 ? "s" : ""} pendente${pendingInvites !== 1 ? "s" : ""}`}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <PlatformInviteMemberDialog
                          shopId={shop.id}
                          shopName={shop.name}
                        />
                        <PlatformShopStatusButton
                          shopId={shop.id}
                          shopName={shop.name}
                          status={shop.status}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default PlatformPage
