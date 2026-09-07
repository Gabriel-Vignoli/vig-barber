import { requireAdmin } from "../_lib/require-admin"
import Header from "../components/header"

const AdminPage = async () => {
  const admin = await requireAdmin()

  return (
    <>
      <Header />
      <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
        <h1 className="text-xl font-bold lg:text-2xl">Painel Admin</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {admin.name}. Área restrita a administradores.
        </p>
      </div>
    </>
  )
}

export default AdminPage
