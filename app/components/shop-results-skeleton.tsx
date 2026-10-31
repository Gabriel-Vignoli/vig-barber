// Placeholder cards for the landing page finder while the results load
const ShopResultsSkeleton = () => (
  <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="bg-muted h-44 w-full rounded-xl" />
    ))}
  </div>
)

export default ShopResultsSkeleton
