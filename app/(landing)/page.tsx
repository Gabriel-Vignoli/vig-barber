import { Suspense } from "react"
import type { Metadata } from "next"
import Form from "next/form"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  CalendarCheckIcon,
  ChartColumnIcon,
  SearchIcon,
  StoreIcon,
  UsersIcon,
} from "lucide-react"
import { getSessionUserId } from "../_lib/tenant"
import { getFirstShopWithRole } from "../_lib/staff-shop"
import { getPlatformContact } from "../_lib/platform-contact"
import {
  parseShopSearchQuery,
  SHOP_SEARCH_MAX_LENGTH,
} from "../_lib/validations/shop-search"
import { searchShops, SHOP_SEARCH_LIMIT } from "../_data/search-shops"
import Header from "../components/header"
import LandingContactCta from "../components/landing-contact-cta"
import ShopSearchResult from "../components/shop-search-result"
import ShopResultsSkeleton from "../components/shop-results-skeleton"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Input } from "../components/ui/input"

export const metadata: Metadata = {
  title: { absolute: "Vig Barber | Agendamento online para barbearias" },
}

const FEATURES = [
  {
    icon: CalendarCheckIcon,
    title: "Agenda online 24h",
    description:
      "Seus clientes escolhem o serviço, o barbeiro e o horário direto pelo celular.",
  },
  {
    icon: UsersIcon,
    title: "Equipe organizada",
    description:
      "Cada barbeiro com seus horários e serviços, e uma tela para o atendente registrar quem chega sem horário.",
  },
  {
    icon: ChartColumnIcon,
    title: "Gestão em um só lugar",
    description:
      "Faturamento, despesas e desempenho da equipe no painel administrativo.",
  },
]

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const Home = async ({ searchParams }: HomeProps) => {
  const userId = await getSessionUserId()

  // Barbers used to have / as their home: keep sending them to their shop's
  // staff dashboard (307, depends on the user). Admins and atendentes use
  // /painel or their area links.
  if (userId) {
    const staffShop = await getFirstShopWithRole(userId, ["EMPLOYEE"])

    if (staffShop) {
      redirect(`/b/${staffShop.slug}/staff`)
    }
  }

  const query = parseShopSearchQuery((await searchParams).q)
  const contact = getPlatformContact()
  const hasContact = Boolean(contact.emailHref || contact.whatsappHref)

  return (
    <div>
      <Header />

      {/* Hero for shop owners */}
      <section className="border-b px-4 py-10 md:px-8 lg:px-16 lg:py-16 xl:px-32">
        <div className="max-w-3xl space-y-5">
          <p className="text-primary text-sm font-semibold tracking-wide uppercase">
            Vig Barber para barbearias
          </p>
          <h1 className="text-3xl leading-tight font-bold md:text-4xl xl:text-5xl">
            Sua barbearia com agendamento online, equipe e caixa no mesmo lugar
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Ganhe uma página própria onde seus clientes reservam horários a
            qualquer hora, sem precisar chamar no WhatsApp.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <LandingContactCta contact={contact} />
            <Link
              href="#encontrar"
              className="text-primary inline-flex h-11 items-center justify-center px-2 text-base font-semibold hover:underline"
            >
              Quero agendar um horário
            </Link>
          </div>
        </div>
      </section>

      {/* Shop finder for clients */}
      <section
        id="encontrar"
        className="scroll-mt-4 space-y-6 px-4 py-10 md:px-8 lg:px-16 xl:px-32"
      >
        <div className="space-y-1">
          <h2 className="text-xl font-bold lg:text-2xl xl:text-3xl">
            Encontre uma barbearia
          </h2>
          <p className="text-muted-foreground text-sm xl:text-base">
            Busque pelo nome da barbearia ou pela cidade.
          </p>
        </div>

        <Form
          action="/"
          scroll={false}
          role="search"
          className="flex max-w-2xl gap-2"
        >
          <label htmlFor="shop-search" className="sr-only">
            Nome da barbearia ou cidade
          </label>
          <Input
            id="shop-search"
            name="q"
            type="search"
            defaultValue={query}
            maxLength={SHOP_SEARCH_MAX_LENGTH}
            placeholder="Ex.: Vig Barber ou São Paulo"
            className="h-11 px-4 text-base"
          />
          <Button
            type="submit"
            size="icon-lg"
            className="size-11 cursor-pointer"
            aria-label="Buscar"
          >
            <SearchIcon className="size-5" />
          </Button>
        </Form>

        <Suspense key={query} fallback={<ShopResultsSkeleton />}>
          <ShopResults query={query} />
        </Suspense>
      </section>

      {/* Features + owner CTA */}
      <section className="bg-muted/30 border-t px-4 py-10 md:px-8 lg:px-16 lg:py-16 xl:px-32">
        <h2 className="text-xl font-bold lg:text-2xl xl:text-3xl">
          Tudo o que sua barbearia precisa
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardContent className="space-y-3 p-5">
                <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between lg:p-8">
            <div className="space-y-1">
              <h3 className="text-lg font-bold lg:text-xl">
                Tem uma barbearia?
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                {hasContact
                  ? "Fale com a gente e coloque sua barbearia na Vig Barber."
                  : "Em breve você poderá cadastrar sua barbearia na Vig Barber."}
              </p>
            </div>
            <LandingContactCta contact={contact} className="shrink-0" />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

const ShopResults = async ({ query }: { query: string }) => {
  const { shops, hasMore } = await searchShops(query)

  if (shops.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
            <StoreIcon size={22} className="text-primary" />
          </div>
          {query ? (
            <>
              <p className="font-semibold">
                Nenhuma barbearia encontrada para &quot;{query}&quot;.
              </p>
              <p className="text-muted-foreground text-sm">
                Confira a grafia ou tente buscar pela cidade.
              </p>
              <Link
                href="/#encontrar"
                className="text-primary text-sm font-semibold hover:underline"
              >
                Ver todas as barbearias
              </Link>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Ainda não há barbearias disponíveis para agendamento.
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm" aria-live="polite">
        {query
          ? `${shops.length}${hasMore ? "+" : ""} ${
              shops.length === 1 && !hasMore
                ? "barbearia encontrada"
                : "barbearias encontradas"
            } para "${query}"`
          : "Barbearias disponíveis para agendamento"}
      </p>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shops.map((shop) => (
          <li key={shop.slug}>
            <ShopSearchResult shop={shop} />
          </li>
        ))}
      </ul>

      {hasMore && (
        <p className="text-muted-foreground text-center text-sm">
          Mostrando as primeiras {SHOP_SEARCH_LIMIT} barbearias. Refine a busca
          para encontrar a sua.
        </p>
      )}
    </div>
  )
}

export default Home
