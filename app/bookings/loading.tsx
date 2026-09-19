const BookingsLoading = () => {
  return (
    <div className="space-y-3 p-4 lg:mx-auto lg:max-w-5xl lg:space-y-6 lg:p-8 xl:py-12">
      <div className="bg-muted h-7 w-40 animate-pulse rounded lg:h-8" />

      <div className="bg-muted mt-8 h-3 w-24 animate-pulse rounded lg:mt-0" />
      <div className="lg:grid lg:grid-cols-2 lg:gap-4">
        <div className="bg-muted h-24 w-full animate-pulse rounded-xl" />
        <div className="bg-muted h-24 w-full animate-pulse rounded-xl" />
      </div>

      <div className="bg-muted mt-8 h-7 w-32 animate-pulse rounded lg:mt-12 lg:h-8" />
      <div className="bg-muted mt-8 h-3 w-24 animate-pulse rounded lg:mt-0" />
      <div className="lg:grid lg:grid-cols-2 lg:gap-4">
        <div className="bg-muted h-24 w-full animate-pulse rounded-xl" />
        <div className="bg-muted h-24 w-full animate-pulse rounded-xl" />
      </div>
    </div>
  )
}

export default BookingsLoading
