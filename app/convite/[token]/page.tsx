import type { Metadata } from "next"
import Link from "next/link"
import { MailIcon, StoreIcon } from "lucide-react"
import { getSessionUserId } from "../../_lib/tenant"
import { getLoginPath } from "../../_lib/protected-paths"
import { isInvitationExpired } from "../../_lib/invitation"
import { getInvitationByToken } from "../../_data/get-invitation-by-token"
import { getUserEmail } from "../../_data/get-user-email"
import { MEMBER_ROLE_LABELS } from "../../_constants/roles"
import Header from "../../components/header"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import InvitationActions from "../../components/invitation-actions"

export const metadata: Metadata = {
  title: "Convite",
  robots: { index: false, follow: false },
}

const InvitationMessage = ({
  title,
  description,
}: {
  title: string
  description: string
}) => (
  <Card>
    <CardContent className="space-y-3 p-6 text-center">
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
      <Link
        href="/"
        className="text-primary inline-block text-sm font-semibold hover:underline"
      >
        Voltar ao início
      </Link>
    </CardContent>
  </Card>
)

// Accepting an invitation needs the account of the invited email. Signed-out
// visitors can sign in or create that account here and come back.
const InvitationPage = async ({ params }: PageProps<"/convite/[token]">) => {
  const { token } = await params
  const invitation = await getInvitationByToken(token)
  const userId = await getSessionUserId()
  const loginHref = getLoginPath(`/convite/${token}`)

  const renderContent = async () => {
    if (!invitation || invitation.barbershop.status !== "ACTIVE") {
      return (
        <InvitationMessage
          title="Convite inválido"
          description="Este link de convite não existe ou não está mais disponível."
        />
      )
    }

    if (invitation.acceptedAt) {
      return (
        <InvitationMessage
          title="Convite já usado"
          description="Este convite já foi aceito. Se ele foi enviado para você, acesse suas barbearias em Minhas barbearias."
        />
      )
    }

    if (isInvitationExpired(invitation)) {
      return (
        <InvitationMessage
          title="Convite expirado"
          description="Este convite expirou. Peça um novo convite para a barbearia."
        />
      )
    }

    const userEmail = userId ? await getUserEmail(userId) : null

    const emailMatches =
      !!userEmail && userEmail.toLowerCase() === invitation.email.toLowerCase()

    return (
      <Card>
        <CardContent className="space-y-5 p-6 text-center">
          <div className="bg-primary/10 mx-auto flex size-14 items-center justify-center rounded-full">
            <StoreIcon size={26} className="text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg font-bold lg:text-xl">
              Convite para {invitation.barbershop.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              Você foi convidado para entrar na equipe como
            </p>
            <Badge variant="secondary">
              {MEMBER_ROLE_LABELS[invitation.role]}
            </Badge>
          </div>

          <p className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
            <MailIcon size={16} />
            {invitation.email}
          </p>

          {!userId && (
            <>
              <p className="text-sm">
                Entre ou crie sua conta com este email para aceitar.
              </p>
              <InvitationActions mode="signed-out" loginHref={loginHref} />
            </>
          )}

          {userId && !emailMatches && (
            <>
              <p className="text-sm">
                Você está conectado como{" "}
                <strong>{userEmail ?? "outra conta"}</strong>. Este convite é
                para <strong>{invitation.email}</strong>.
              </p>
              <InvitationActions mode="wrong-account" loginHref={loginHref} />
            </>
          )}

          {userId && emailMatches && (
            <InvitationActions mode="accept" token={token} />
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <Header />

      <div className="mx-auto max-w-md p-4 lg:p-8">{await renderContent()}</div>
    </div>
  )
}

export default InvitationPage
