const PlatformLoading = () => {
  return (
    <div
      className="mx-auto max-w-5xl animate-pulse space-y-6 p-4 lg:p-8"
      aria-busy="true"
      aria-label="Carregando"
    >
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="bg-muted h-7 w-40 rounded lg:h-8" />
          <div className="bg-muted h-4 w-28 rounded" />
        </div>
        <div className="bg-muted h-9 w-36 rounded-md" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-muted h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default PlatformLoading
