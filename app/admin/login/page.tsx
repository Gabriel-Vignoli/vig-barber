import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "../../_lib/auth"
import { prisma } from "../../_lib/prisma"
import AdminLoginForm from "../../components/admin-login-form"
import { ShieldIcon } from "lucide-react"

const AdminLoginPage = async () => {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role === "ADMIN") {
      redirect("/admin")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="bg-primary/10 flex size-14 items-center justify-center rounded-full">
        <ShieldIcon size={26} className="text-primary" />
      </div>

      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold">Painel Admin</h1>
        <p className="text-muted-foreground text-sm">
          Acesso restrito a administradores.
        </p>
      </div>

      <AdminLoginForm />
    </div>
  )
}

export default AdminLoginPage
