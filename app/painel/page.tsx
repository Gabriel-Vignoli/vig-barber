import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronRightIcon, StoreIcon } from "lucide-react"
import { getSessionUserId } from "../_lib/tenant"
import { getLoginPath } from "../_lib/protected-paths"
import { getUserMemberships } from "../_data/get-user-memberships"
import { getShopAreaPath, MEMBER_ROLE_LABELS } from "../_constants/roles"
import Header from "../components/header"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"

export const metadata: Metadata = {
  title: "Minhas barbearias",
}

// The signed-in user's shops (active ones only) with a link to the area of
// their role in each
const PainelPage = async () => {
  const userId = await getSessionUserId()

  if (!userId) {
    redirect(getLoginPath("/painel"))
  }

  const memberships = await getUserMemberships(userId)

  return (
    <div>
      <Header />

      <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
        <div>
          <h1 className="text-xl font-bold lg:text-2xl xl:text-3xl">
            Minhas barbearias
          </h1>
          <p className="text-muted-foreground text-sm xl:text-base">
            Escolha a barbearia que você quer gerenciar.
          </p>
        </div>

        {memberships.length === 0 ? (
          <Card>
            <CardContent className="space-y-3 p-6 text-center">
              <p className="text-muted-foreground text-sm xl:text-base">
                Você ainda não faz parte da equipe de nenhuma barbearia.
              </p>
              <Link
                href="/"
                className="text-primary text-sm font-semibold hover:underline"
              >
                Voltar ao início
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {memberships.map((membership) => (
              <li key={membership.id}>
                <Link
                  href={getShopAreaPath(
                    membership.barbershop.slug,
                    membership.role,
                  )}
                  className="block"
                >
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="bg-primary/10 flex size-11 shrink-0 items-center justify-center rounded-full">
                        <StoreIcon size={20} className="text-primary" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {membership.barbershop.name}
                        </p>
                        {membership.barbershop.city && (
                          <p className="text-muted-foreground truncate text-sm">
                            {membership.barbershop.city}
                          </p>
                        )}
                      </div>

                      <Badge variant="secondary" className="shrink-0">
                        {MEMBER_ROLE_LABELS[membership.role]}
                      </Badge>
                      <ChevronRightIcon
                        size={18}
                        className="text-muted-foreground shrink-0"
                      />
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default PainelPage
