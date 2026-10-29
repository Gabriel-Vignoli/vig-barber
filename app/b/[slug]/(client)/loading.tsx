const ShopHomeLoading = () => {
  return (
    <div className="animate-pulse p-4 md:px-8 lg:px-16 lg:pt-14 xl:px-32">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-24 xl:gap-32">
        <div className="mt-2 space-y-3">
          <div className="bg-muted h-7 w-2/3 rounded md:h-9" />
          <div className="bg-muted h-4 w-1/3 rounded" />
          <div className="bg-muted mt-6 h-32 w-full rounded-2xl lg:mt-10" />
          <div className="bg-muted mt-4 h-37.5 w-full rounded-xl lg:h-48" />
        </div>

        <div className="space-y-3">
          <div className="bg-muted h-4 w-48 rounded" />
          <div className="flex gap-5 overflow-hidden">
            <div className="bg-muted h-56 w-44 shrink-0 rounded-xl md:h-64 md:w-60" />
            <div className="bg-muted h-56 w-44 shrink-0 rounded-xl md:h-64 md:w-60" />
          </div>
        </div>
      </div>

      <div className="bg-muted mt-8 h-4 w-40 rounded md:mt-12 lg:mt-16" />
      <div className="mt-3 flex gap-4 overflow-hidden">
        <div className="bg-muted h-64 w-36 shrink-0 rounded-xl md:w-52 lg:w-60" />
        <div className="bg-muted h-64 w-36 shrink-0 rounded-xl md:w-52 lg:w-60" />
        <div className="bg-muted h-64 w-36 shrink-0 rounded-xl md:w-52 lg:w-60" />
      </div>
    </div>
  )
}

export default ShopHomeLoading
