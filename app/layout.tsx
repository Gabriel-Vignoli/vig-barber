import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import Footer from "./components/footer"
import AuthProvider from "./_providers/auth"
import { AuthToastListener } from "./components/auth-toast-listener"
import CookieConsentBanner from "./components/cookie-consent-banner"

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
})

// Platform-wide defaults. Shop pages override them in app/b/[slug]/layout.tsx.
export const metadata: Metadata = {
  title: {
    default: "Vig Barber",
    template: "%s | Vig Barber",
  },
  description:
    "Vig Barber é a plataforma de agendamento online para barbearias. Encontre uma barbearia, escolha o serviço e o profissional e reserve seu horário.",
  applicationName: "Vig Barber",
  icons: {
    icon: "/scissor-icon.svg",
  },
  openGraph: {
    siteName: "Vig Barber",
    locale: "pt_BR",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} dark h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <div className="flex h-full flex-col">
            <div className="flex-1">{children}</div>
            <Footer></Footer>
          </div>
        </AuthProvider>
        <Toaster></Toaster>
        <AuthToastListener></AuthToastListener>
        <CookieConsentBanner></CookieConsentBanner>
      </body>
    </html>
  )
}
