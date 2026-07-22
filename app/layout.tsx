import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import Footer from "./components/footer"

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Vig Barber",
  description: "Agende seu horário com os melhores barbeiros",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} dark h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster></Toaster>
        <Footer></Footer>
      </body>
    </html>
  )
}
