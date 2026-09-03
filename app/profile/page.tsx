import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "../_lib/auth"
import { prisma } from "../_lib/prisma"
import Header from "../components/header"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Card, CardContent } from "../components/ui/card"
import ProfileNameForm from "../components/profile-name-form"
import ProfilePasswordForm from "../components/profile-password-form"

const getInitials = (name?: string | null) => {
  if (!name) return "?"

  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.charAt(0) ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ""

  return (first + last).toUpperCase()
}

const ProfilePage = async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true, password: true },
  })

  if (!user) {
    redirect("/")
  }

  return (
    <>
      <Header />
      <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-8">
        <h1 className="text-xl font-bold lg:text-2xl">Meu Perfil</h1>

        <div className="flex items-center gap-3">
          <Avatar className="size-14">
            <AvatarImage
              src={user.image ?? ""}
              alt={user.name ?? "User"}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold">{user.name}</p>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-4 p-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase">
              Informações pessoais
            </h2>
            <ProfileNameForm currentName={user.name ?? ""} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase">
              {user.password ? "Alterar senha" : "Definir senha"}
            </h2>
            <ProfilePasswordForm hasPassword={Boolean(user.password)} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default ProfilePage
