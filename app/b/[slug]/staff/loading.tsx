const StaffLoading = () => {
  return (
    <div
      className="mx-auto max-w-5xl animate-pulse space-y-6 p-4 md:px-8 lg:px-16 lg:py-10 xl:px-32"
      aria-busy="true"
      aria-label="Carregando"
    >
      <div className="space-y-2">
        <div className="bg-muted h-7 w-48 rounded lg:h-8" />
        <div className="bg-muted h-4 w-64 rounded" />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="bg-muted h-9 w-32 rounded-md" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-muted h-28 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default StaffLoading
