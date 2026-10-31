import ShopResultsSkeleton from "../components/shop-results-skeleton"

const LandingLoading = () => {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Carregando">
      <div className="bg-muted h-16 w-full md:h-20" />

      <div className="space-y-5 border-b px-4 py-10 md:px-8 lg:px-16 lg:py-16 xl:px-32">
        <div className="bg-muted h-4 w-48 rounded" />
        <div className="bg-muted h-9 w-full max-w-2xl rounded lg:h-12" />
        <div className="bg-muted h-5 w-full max-w-xl rounded" />
        <div className="bg-muted h-11 w-48 rounded-lg" />
      </div>

      <div className="space-y-6 px-4 py-10 md:px-8 lg:px-16 xl:px-32">
        <div className="space-y-2">
          <div className="bg-muted h-7 w-60 rounded lg:h-8" />
          <div className="bg-muted h-4 w-72 rounded" />
        </div>
        <div className="bg-muted h-11 w-full max-w-2xl rounded-lg" />
        <ShopResultsSkeleton />
      </div>
    </div>
  )
}

export default LandingLoading
