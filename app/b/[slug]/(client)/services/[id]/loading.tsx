const ServiceLoading = () => {
  return (
    <div className="animate-pulse space-y-8 p-4 lg:mx-auto lg:max-w-5xl lg:p-8">
      <div className="flex justify-center pt-12">
        <div className="bg-muted h-80 w-full max-w-sm rounded-xl" />
      </div>
      <div className="space-y-3">
        <div className="bg-muted h-4 w-32 rounded" />
        <div className="flex gap-5 overflow-hidden">
          <div className="bg-muted h-56 w-44 shrink-0 rounded-xl md:h-64 md:w-60" />
          <div className="bg-muted h-56 w-44 shrink-0 rounded-xl md:h-64 md:w-60" />
        </div>
      </div>
    </div>
  )
}

export default ServiceLoading
