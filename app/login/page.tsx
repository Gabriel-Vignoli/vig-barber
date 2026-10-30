import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getSessionUserId } from "../_lib/tenant"
import { resolvePostLoginPath } from "../_lib/staff-shop"
import { getSafeCallbackUrl } from "../_lib/safe-callback-url"
import LoginForm from "../components/login-form"

export const metadata: Metadata = {
  title: "Entrar",
}

// Global login for clients and staff. A signed-in user (also the Google flow,
// which comes back here) is sent to the safe callbackUrl or their staff area.
const LoginPage = async ({ searchParams }: PageProps<"/login">) => {
  const { callbackUrl } = await searchParams
  const safeCallbackUrl = getSafeCallbackUrl(callbackUrl)

  const userId = await getSessionUserId()

  if (userId) {
    redirect(await resolvePostLoginPath(userId, safeCallbackUrl))
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 xl:gap-8">
      <Link href="/">
        <Image
          src="/logo.png"
          alt="Vig Barber"
          width={140}
          height={34}
          priority
          className="xl:w-40"
        />
      </Link>

      <div className="space-y-1 text-center xl:space-y-2">
        <h1 className="text-xl font-bold xl:text-2xl">Entrar</h1>
        <p className="text-muted-foreground text-sm xl:text-base">
          Acesse sua conta para agendar ou gerenciar sua barbearia.
        </p>
      </div>

      <LoginForm callbackUrl={safeCallbackUrl} />
    </div>
  )
}

export default LoginPage
